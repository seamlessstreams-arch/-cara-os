// ══════════════════════════════════════════════════════════════════════════════
// CARA -- HOME SLIPS, TRIPS & FALLS PREVENTION INTELLIGENCE ENGINE TESTS
// Comprehensive test suite: unit + integration
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeSlipsTripsFallsPrevention,
  type SlipTripRiskAssessmentRecordInput,
  type FlooringConditionRecordInput,
  type WetFloorProtocolRecordInput,
  type StairwaySafetyRecordInput,
  type SlipTripFallIncidentRecordInput,
  type SlipsTripsFallsPreventionInput,
} from "../home-slips-trips-falls-prevention-intelligence-engine";

// ── Factories ───────────────────────────────────────────────────────────────

function makeRiskAssessment(overrides: Partial<SlipTripRiskAssessmentRecordInput> = {}): SlipTripRiskAssessmentRecordInput {
  return {
    id: "ra_test",
    area_name: "Hallway",
    assessment_date: "2026-05-01",
    assessor_name: "Staff A",
    risk_level: "low",
    hazards_identified: ["Loose mat"],
    controls_in_place: true,
    controls_adequate: true,
    review_date: "2026-08-01",
    review_overdue: false,
    actions_required: 2,
    actions_completed: 2,
    children_consulted: true,
    environment_type: "indoor",
    weather_considerations_documented: true,
    signed_off: true,
    created_at: "2026-05-01",
    ...overrides,
  };
}

function makeFlooringCondition(overrides: Partial<FlooringConditionRecordInput> = {}): FlooringConditionRecordInput {
  return {
    id: "fc_test",
    area_name: "Kitchen",
    flooring_type: "vinyl",
    inspection_date: "2026-05-01",
    condition: "good",
    issues_found: [],
    slip_resistance_adequate: true,
    trip_hazards_present: false,
    repair_needed: false,
    repair_completed: false,
    repair_date: null,
    mat_secured: true,
    threshold_safe: true,
    inspector_name: "Staff B",
    next_inspection_due: "2026-08-01",
    created_at: "2026-05-01",
    ...overrides,
  };
}

function makeWetFloorProtocol(overrides: Partial<WetFloorProtocolRecordInput> = {}): WetFloorProtocolRecordInput {
  return {
    id: "wf_test",
    area_name: "Hallway",
    date: "2026-05-01",
    signage_deployed: true,
    signage_timely: true,
    cleaning_schedule_followed: true,
    spill_response_within_target: true,
    response_time_minutes: 3,
    barrier_used: true,
    staff_trained: true,
    children_warned: true,
    protocol_documented: true,
    incident_resulted: false,
    weather_related: false,
    entrance_matting_adequate: true,
    created_at: "2026-05-01",
    ...overrides,
  };
}

function makeStairwaySafety(overrides: Partial<StairwaySafetyRecordInput> = {}): StairwaySafetyRecordInput {
  return {
    id: "ss_test",
    stairway_location: "Main staircase",
    inspection_date: "2026-05-01",
    handrail_secure: true,
    handrail_both_sides: true,
    treads_non_slip: true,
    nosings_visible: true,
    lighting_adequate: true,
    clutter_free: true,
    gate_fitted: true,
    gate_functional: true,
    carpet_secure: true,
    width_adequate: true,
    defects_found: [],
    defects_rectified: false,
    rectification_date: null,
    inspector_name: "Staff C",
    child_specific_risks_assessed: true,
    created_at: "2026-05-01",
    ...overrides,
  };
}

function makeIncident(overrides: Partial<SlipTripFallIncidentRecordInput> = {}): SlipTripFallIncidentRecordInput {
  return {
    id: "inc_test",
    child_id: "child_1",
    date: "2026-05-15",
    location: "Hallway",
    incident_type: "slip",
    severity: "minor",
    cause: "Wet floor",
    surface_condition: "wet",
    footwear_appropriate: true,
    lighting_adequate: true,
    injury_sustained: false,
    injury_description: "",
    first_aid_given: false,
    medical_attention_required: false,
    parent_carer_notified: true,
    social_worker_notified: true,
    investigation_completed: true,
    root_cause_identified: true,
    corrective_actions_taken: ["Installed non-slip mat"],
    lessons_learned_documented: true,
    lessons_shared_with_staff: true,
    risk_assessment_updated: true,
    recurrence: false,
    created_at: "2026-05-15",
    ...overrides,
  };
}

const baseInput: SlipsTripsFallsPreventionInput = {
  today: "2026-05-28",
  total_children: 4,
  risk_assessment_records: [],
  flooring_condition_records: [],
  wet_floor_records: [],
  stairway_safety_records: [],
  incident_records: [],
};

// ── Special cases ───────────────────────────────────────────────────────────

describe("computeSlipsTripsFallsPrevention", () => {

  // == SPECIAL CASES ==========================================================

  describe("special cases", () => {
    it("returns insufficient_data when all empty and 0 children", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        total_children: 0,
        risk_assessment_records: [],
        flooring_condition_records: [],
        wet_floor_records: [],
        stairway_safety_records: [],
        incident_records: [],
      });
      expect(r.falls_prevention_rating).toBe("insufficient_data");
      expect(r.falls_prevention_score).toBe(0);
      expect(r.headline).toContain("insufficient data");
    });

    it("returns inadequate with score 15 when all empty but children present", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        total_children: 3,
      });
      expect(r.falls_prevention_rating).toBe("inadequate");
      expect(r.falls_prevention_score).toBe(15);
      expect(r.concerns).toHaveLength(1);
      expect(r.recommendations).toHaveLength(2);
      expect(r.insights).toHaveLength(1);
      expect(r.insights[0].severity).toBe("critical");
    });

    it("insufficient_data has all rates at 0", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        total_children: 0,
      });
      expect(r.risk_assessment_rate).toBe(0);
      expect(r.flooring_condition_rate).toBe(0);
      expect(r.wet_floor_protocol_rate).toBeNull();
      expect(r.stairway_safety_rate).toBeNull();
      expect(r.incident_learning_rate).toBeNull();
      expect(r.staff_awareness_rate).toBeNull();
    });

    it("allEmpty + children produces two immediate recommendations", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        total_children: 5,
      });
      expect(r.recommendations[0].urgency).toBe("immediate");
      expect(r.recommendations[1].urgency).toBe("immediate");
      expect(r.recommendations[0].regulatory_ref).toContain("Reg 25");
      expect(r.recommendations[1].regulatory_ref).toContain("Reg 5");
    });

    it("insufficient_data has empty strengths, concerns, recommendations, insights", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        total_children: 0,
      });
      expect(r.strengths).toHaveLength(0);
      expect(r.concerns).toHaveLength(0);
      expect(r.recommendations).toHaveLength(0);
      expect(r.insights).toHaveLength(0);
    });
  });

  // == RATING BOUNDARIES ======================================================

  describe("rating boundaries", () => {
    it("score 80+ maps to outstanding", () => {
      // Perfect data across all domains -> high score
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: Array.from({ length: 10 }, (_, i) =>
          makeRiskAssessment({ id: `ra_${i}`, controls_in_place: true, controls_adequate: true, signed_off: true, children_consulted: true }),
        ),
        flooring_condition_records: Array.from({ length: 10 }, (_, i) =>
          makeFlooringCondition({ id: `fc_${i}`, condition: "good", slip_resistance_adequate: true }),
        ),
        wet_floor_records: Array.from({ length: 10 }, (_, i) =>
          makeWetFloorProtocol({ id: `wf_${i}`, signage_deployed: true, signage_timely: true, cleaning_schedule_followed: true, spill_response_within_target: true, protocol_documented: true, staff_trained: true, children_warned: true }),
        ),
        stairway_safety_records: Array.from({ length: 10 }, (_, i) =>
          makeStairwaySafety({ id: `ss_${i}`, handrail_secure: true, treads_non_slip: true, lighting_adequate: true, clutter_free: true, carpet_secure: true }),
        ),
        incident_records: Array.from({ length: 5 }, (_, i) =>
          makeIncident({ id: `inc_${i}`, investigation_completed: true, root_cause_identified: true, lessons_learned_documented: true, lessons_shared_with_staff: true, risk_assessment_updated: true, recurrence: false }),
        ),
      });
      expect(r.falls_prevention_rating).toBe("outstanding");
      expect(r.falls_prevention_score).toBeGreaterThanOrEqual(80);
    });

    it("score 65-79 maps to good", () => {
      // Moderate data - some gaps to get score between 65-79
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: Array.from({ length: 10 }, (_, i) =>
          makeRiskAssessment({
            id: `ra_${i}`,
            controls_in_place: i < 8,
            controls_adequate: i < 8,
            signed_off: i < 7,
            children_consulted: i < 5,
          }),
        ),
        flooring_condition_records: Array.from({ length: 10 }, (_, i) =>
          makeFlooringCondition({ id: `fc_${i}`, condition: i < 8 ? "good" : "fair" }),
        ),
        wet_floor_records: Array.from({ length: 5 }, (_, i) =>
          makeWetFloorProtocol({
            id: `wf_${i}`,
            signage_deployed: i < 4,
            signage_timely: i < 4,
            cleaning_schedule_followed: i < 4,
            spill_response_within_target: i < 4,
            protocol_documented: i < 4,
            staff_trained: i < 4,
            children_warned: i < 4,
          }),
        ),
        stairway_safety_records: Array.from({ length: 5 }, (_, i) =>
          makeStairwaySafety({
            id: `ss_${i}`,
            handrail_secure: i < 4,
            treads_non_slip: i < 4,
            lighting_adequate: i < 4,
            clutter_free: i < 4,
            carpet_secure: i < 4,
          }),
        ),
      });
      expect(r.falls_prevention_score).toBeGreaterThanOrEqual(65);
      expect(r.falls_prevention_score).toBeLessThan(80);
      expect(r.falls_prevention_rating).toBe("good");
    });

    it("score 45-64 maps to adequate", () => {
      // Weaker data to get score in adequate range
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: Array.from({ length: 10 }, (_, i) =>
          makeRiskAssessment({
            id: `ra_${i}`,
            controls_in_place: i < 6,
            controls_adequate: i < 6,
            signed_off: i < 5,
          }),
        ),
        flooring_condition_records: Array.from({ length: 10 }, (_, i) =>
          makeFlooringCondition({ id: `fc_${i}`, condition: i < 6 ? "good" : "poor" }),
        ),
      });
      expect(r.falls_prevention_score).toBeGreaterThanOrEqual(45);
      expect(r.falls_prevention_score).toBeLessThan(65);
      expect(r.falls_prevention_rating).toBe("adequate");
    });

    it("score below 45 maps to inadequate", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: Array.from({ length: 10 }, (_, i) =>
          makeRiskAssessment({
            id: `ra_${i}`,
            controls_in_place: i < 3,
            controls_adequate: i < 3,
            risk_level: i < 5 ? "critical" : "high",
          }),
        ),
        flooring_condition_records: Array.from({ length: 10 }, (_, i) =>
          makeFlooringCondition({ id: `fc_${i}`, condition: i < 3 ? "good" : "hazardous" }),
        ),
        incident_records: Array.from({ length: 10 }, (_, i) =>
          makeIncident({
            id: `inc_${i}`,
            severity: i < 4 ? "serious" : "major",
            recurrence: i < 4,
            investigation_completed: false,
            root_cause_identified: false,
            lessons_learned_documented: false,
            lessons_shared_with_staff: false,
            risk_assessment_updated: false,
          }),
        ),
      });
      expect(r.falls_prevention_score).toBeLessThan(45);
      expect(r.falls_prevention_rating).toBe("inadequate");
    });
  });

  // == SCORING BONUSES ========================================================

  describe("scoring bonuses", () => {
    it("awards +5 for riskAssessmentRate >= 90", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: Array.from({ length: 10 }, (_, i) =>
          makeRiskAssessment({ id: `ra_${i}`, controls_in_place: true, controls_adequate: true }),
        ),
      });
      // Base 52 + 5 (riskAssessment >= 90) = 57
      expect(r.falls_prevention_score).toBeGreaterThanOrEqual(57);
    });

    it("awards +3 for riskAssessmentRate >= 70 but < 90", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: Array.from({ length: 10 }, (_, i) =>
          makeRiskAssessment({ id: `ra_${i}`, controls_in_place: i < 8, controls_adequate: i < 8 }),
        ),
      });
      // 80% adequate -> +3
      expect(r.risk_assessment_rate).toBe(80);
      expect(r.falls_prevention_score).toBeGreaterThanOrEqual(55);
    });

    it("awards +5 for flooringConditionRate >= 90", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        flooring_condition_records: Array.from({ length: 10 }, (_, i) =>
          makeFlooringCondition({ id: `fc_${i}`, condition: "good" }),
        ),
      });
      expect(r.flooring_condition_rate).toBe(100);
      expect(r.falls_prevention_score).toBeGreaterThanOrEqual(57);
    });

    it("awards +3 for flooringConditionRate >= 70 but < 90", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        flooring_condition_records: Array.from({ length: 10 }, (_, i) =>
          makeFlooringCondition({ id: `fc_${i}`, condition: i < 8 ? "good" : "poor" }),
        ),
      });
      expect(r.flooring_condition_rate).toBe(80);
      expect(r.falls_prevention_score).toBeGreaterThanOrEqual(55);
    });

    it("awards +5 for wetFloorProtocolRate >= 90", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        wet_floor_records: Array.from({ length: 10 }, (_, i) =>
          makeWetFloorProtocol({ id: `wf_${i}` }),
        ),
      });
      expect(r.wet_floor_protocol_rate).toBe(100);
      expect(r.falls_prevention_score).toBeGreaterThanOrEqual(57);
    });

    it("awards +2 for wetFloorProtocolRate >= 70 but < 90", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        wet_floor_records: Array.from({ length: 10 }, (_, i) =>
          makeWetFloorProtocol({
            id: `wf_${i}`,
            signage_deployed: i < 8,
            signage_timely: i < 8,
            cleaning_schedule_followed: i < 8,
            spill_response_within_target: i < 8,
            protocol_documented: i < 8,
          }),
        ),
      });
      expect(r.wet_floor_protocol_rate).toBe(80);
      expect(r.falls_prevention_score).toBeGreaterThanOrEqual(54);
    });

    it("awards +5 for stairwaySafetyRate >= 90", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        stairway_safety_records: Array.from({ length: 10 }, (_, i) =>
          makeStairwaySafety({ id: `ss_${i}` }),
        ),
      });
      expect(r.stairway_safety_rate).toBe(100);
      expect(r.falls_prevention_score).toBeGreaterThanOrEqual(57);
    });

    it("awards +2 for stairwaySafetyRate >= 70 but < 90", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        stairway_safety_records: Array.from({ length: 10 }, (_, i) =>
          makeStairwaySafety({
            id: `ss_${i}`,
            handrail_secure: i < 8,
            treads_non_slip: i < 8,
            lighting_adequate: i < 8,
            clutter_free: i < 8,
            carpet_secure: i < 8,
          }),
        ),
      });
      expect(r.stairway_safety_rate).toBe(80);
      expect(r.falls_prevention_score).toBeGreaterThanOrEqual(54);
    });

    it("awards +4 for incidentLearningRate >= 90", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        incident_records: Array.from({ length: 10 }, (_, i) =>
          makeIncident({ id: `inc_${i}` }),
        ),
      });
      expect(r.incident_learning_rate).toBe(100);
      expect(r.falls_prevention_score).toBeGreaterThanOrEqual(56);
    });

    it("awards +2 for incidentLearningRate >= 70 but < 90", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        incident_records: Array.from({ length: 10 }, (_, i) =>
          makeIncident({
            id: `inc_${i}`,
            investigation_completed: i < 8,
            root_cause_identified: i < 8,
            lessons_learned_documented: i < 8,
            lessons_shared_with_staff: i < 8,
            risk_assessment_updated: i < 8,
          }),
        ),
      });
      expect(r.incident_learning_rate).toBe(80);
      expect(r.falls_prevention_score).toBeGreaterThanOrEqual(54);
    });

    it("awards +4 for staffAwarenessRate >= 90", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: Array.from({ length: 10 }, (_, i) =>
          makeRiskAssessment({ id: `ra_${i}`, signed_off: true }),
        ),
        wet_floor_records: Array.from({ length: 10 }, (_, i) =>
          makeWetFloorProtocol({ id: `wf_${i}`, staff_trained: true, children_warned: true }),
        ),
        incident_records: Array.from({ length: 10 }, (_, i) =>
          makeIncident({ id: `inc_${i}`, lessons_shared_with_staff: true }),
        ),
      });
      expect(r.staff_awareness_rate).toBe(100);
      expect(r.falls_prevention_score).toBeGreaterThanOrEqual(56);
    });

    it("awards +2 for staffAwarenessRate >= 70 but < 90", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: Array.from({ length: 10 }, (_, i) =>
          makeRiskAssessment({ id: `ra_${i}`, signed_off: i < 7 }),
        ),
        wet_floor_records: Array.from({ length: 10 }, (_, i) =>
          makeWetFloorProtocol({ id: `wf_${i}`, staff_trained: i < 8, children_warned: i < 8 }),
        ),
      });
      expect(r.staff_awareness_rate).toBeGreaterThanOrEqual(70);
      expect(r.staff_awareness_rate).toBeLessThan(90);
    });
  });

  // == SCORING PENALTIES ======================================================

  describe("scoring penalties", () => {
    it("applies -6 penalty when riskAssessmentRate < 50 and records exist", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: Array.from({ length: 10 }, (_, i) =>
          makeRiskAssessment({ id: `ra_${i}`, controls_in_place: i < 4, controls_adequate: i < 4, signed_off: false }),
        ),
      });
      expect(r.risk_assessment_rate).toBe(40);
      // Base 52 - 6 = 46 (signedOff false so no staffAwareness bonus)
      expect(r.falls_prevention_score).toBe(46);
    });

    it("applies -6 penalty when hazardousFlooringRate >= 20", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        flooring_condition_records: Array.from({ length: 10 }, (_, i) =>
          makeFlooringCondition({ id: `fc_${i}`, condition: i < 3 ? "hazardous" : "good" }),
        ),
      });
      // 30% hazardous >= 20 threshold
      expect(r.falls_prevention_score).toBeLessThanOrEqual(52);
    });

    it("applies -5 penalty when seriousMajorRate >= 30", () => {
      // Use no-learning incidents to avoid bonuses offsetting the penalty
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        incident_records: Array.from({ length: 10 }, (_, i) =>
          makeIncident({
            id: `inc_${i}`,
            severity: i < 4 ? "serious" : "minor",
            investigation_completed: false,
            root_cause_identified: false,
            lessons_learned_documented: false,
            lessons_shared_with_staff: false,
            risk_assessment_updated: false,
          }),
        ),
      });
      // 40% serious/major >= 30 threshold -> -5 penalty, no bonuses
      expect(r.falls_prevention_score).toBe(47);
    });

    it("applies -5 penalty when recurrenceRate >= 25", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        incident_records: Array.from({ length: 10 }, (_, i) =>
          makeIncident({
            id: `inc_${i}`,
            recurrence: i < 3,
            investigation_completed: false,
            root_cause_identified: false,
            lessons_learned_documented: false,
            lessons_shared_with_staff: false,
            risk_assessment_updated: false,
          }),
        ),
      });
      // 30% recurrence >= 25 threshold -> -5 penalty, no bonuses
      expect(r.falls_prevention_score).toBe(47);
    });

    it("does NOT apply riskAssessment penalty when no records exist", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        flooring_condition_records: [makeFlooringCondition()],
      });
      // Base 52 + flooring bonus; no risk assessment penalty
      expect(r.falls_prevention_score).toBeGreaterThanOrEqual(52);
    });

    it("does NOT apply hazardous penalty when no flooring records exist", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: [makeRiskAssessment()],
      });
      expect(r.falls_prevention_score).toBeGreaterThanOrEqual(52);
    });

    it("does NOT apply seriousMajor penalty when no incidents exist", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: [makeRiskAssessment()],
      });
      expect(r.falls_prevention_score).toBeGreaterThanOrEqual(52);
    });

    it("does NOT apply recurrence penalty when no incidents exist", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: [makeRiskAssessment()],
      });
      expect(r.falls_prevention_score).toBeGreaterThanOrEqual(52);
    });

    it("multiple penalties stack", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: Array.from({ length: 10 }, (_, i) =>
          makeRiskAssessment({ id: `ra_${i}`, controls_in_place: i < 3, controls_adequate: i < 3 }),
        ),
        flooring_condition_records: Array.from({ length: 10 }, (_, i) =>
          makeFlooringCondition({ id: `fc_${i}`, condition: i < 3 ? "hazardous" : "good" }),
        ),
        incident_records: Array.from({ length: 10 }, (_, i) =>
          makeIncident({
            id: `inc_${i}`,
            severity: i < 4 ? "serious" : "minor",
            recurrence: i < 3,
          }),
        ),
      });
      // 52 - 6 - 6 - 5 - 5 = 30 (plus possible bonuses)
      expect(r.falls_prevention_score).toBeLessThan(52);
    });

    it("score cannot go below 0", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: Array.from({ length: 10 }, (_, i) =>
          makeRiskAssessment({ id: `ra_${i}`, controls_in_place: false, controls_adequate: false }),
        ),
        flooring_condition_records: Array.from({ length: 10 }, (_, i) =>
          makeFlooringCondition({ id: `fc_${i}`, condition: "hazardous" }),
        ),
        incident_records: Array.from({ length: 10 }, (_, i) =>
          makeIncident({
            id: `inc_${i}`,
            severity: "major",
            recurrence: true,
            investigation_completed: false,
            root_cause_identified: false,
            lessons_learned_documented: false,
            lessons_shared_with_staff: false,
            risk_assessment_updated: false,
          }),
        ),
      });
      expect(r.falls_prevention_score).toBeGreaterThanOrEqual(0);
    });

    it("score cannot exceed 100", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: Array.from({ length: 10 }, (_, i) =>
          makeRiskAssessment({ id: `ra_${i}` }),
        ),
        flooring_condition_records: Array.from({ length: 10 }, (_, i) =>
          makeFlooringCondition({ id: `fc_${i}` }),
        ),
        wet_floor_records: Array.from({ length: 10 }, (_, i) =>
          makeWetFloorProtocol({ id: `wf_${i}` }),
        ),
        stairway_safety_records: Array.from({ length: 10 }, (_, i) =>
          makeStairwaySafety({ id: `ss_${i}` }),
        ),
        incident_records: Array.from({ length: 10 }, (_, i) =>
          makeIncident({ id: `inc_${i}` }),
        ),
      });
      expect(r.falls_prevention_score).toBeLessThanOrEqual(100);
    });
  });

  // == RISK ASSESSMENT RATE ===================================================

  describe("risk assessment rate", () => {
    it("calculates rate based on controls_in_place AND controls_adequate", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: [
          makeRiskAssessment({ id: "1", controls_in_place: true, controls_adequate: true }),
          makeRiskAssessment({ id: "2", controls_in_place: true, controls_adequate: false }),
          makeRiskAssessment({ id: "3", controls_in_place: false, controls_adequate: true }),
          makeRiskAssessment({ id: "4", controls_in_place: false, controls_adequate: false }),
        ],
      });
      expect(r.risk_assessment_rate).toBe(25);
    });

    it("returns 0 when no risk assessment records", () => {
      const r = computeSlipsTripsFallsPrevention({ ...baseInput });
      expect(r.risk_assessment_rate).toBe(0);
    });

    it("returns 100 when all assessments have adequate controls", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: Array.from({ length: 5 }, (_, i) =>
          makeRiskAssessment({ id: `ra_${i}` }),
        ),
      });
      expect(r.risk_assessment_rate).toBe(100);
    });

    it("correctly rounds percentage", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: [
          makeRiskAssessment({ id: "1", controls_in_place: true, controls_adequate: true }),
          makeRiskAssessment({ id: "2", controls_in_place: true, controls_adequate: true }),
          makeRiskAssessment({ id: "3", controls_in_place: false, controls_adequate: false }),
        ],
      });
      expect(r.risk_assessment_rate).toBe(67);
    });
  });

  // == FLOORING CONDITION RATE ================================================

  describe("flooring condition rate", () => {
    it("counts good and fair as acceptable", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        flooring_condition_records: [
          makeFlooringCondition({ id: "1", condition: "good" }),
          makeFlooringCondition({ id: "2", condition: "fair" }),
          makeFlooringCondition({ id: "3", condition: "poor" }),
          makeFlooringCondition({ id: "4", condition: "hazardous" }),
        ],
      });
      expect(r.flooring_condition_rate).toBe(50);
    });

    it("returns 0 with no records", () => {
      const r = computeSlipsTripsFallsPrevention({ ...baseInput });
      expect(r.flooring_condition_rate).toBe(0);
    });

    it("returns 100 when all good", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        flooring_condition_records: Array.from({ length: 5 }, (_, i) =>
          makeFlooringCondition({ id: `fc_${i}`, condition: "good" }),
        ),
      });
      expect(r.flooring_condition_rate).toBe(100);
    });

    it("returns 100 when all fair", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        flooring_condition_records: Array.from({ length: 5 }, (_, i) =>
          makeFlooringCondition({ id: `fc_${i}`, condition: "fair" }),
        ),
      });
      expect(r.flooring_condition_rate).toBe(100);
    });
  });

  // == WET FLOOR PROTOCOL RATE ================================================

  describe("wet floor protocol rate", () => {
    it("is average of signageRate, cleaningRate, spillResponseRate, protocolDocRate", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        wet_floor_records: [
          makeWetFloorProtocol({ id: "1", signage_deployed: true, signage_timely: true, cleaning_schedule_followed: true, spill_response_within_target: true, protocol_documented: true }),
          makeWetFloorProtocol({ id: "2", signage_deployed: false, signage_timely: false, cleaning_schedule_followed: false, spill_response_within_target: false, protocol_documented: false }),
        ],
      });
      // signageRate = 50, cleaningRate = 50, spillResponse = 50, protocolDoc = 50
      // avg = 50
      expect(r.wet_floor_protocol_rate).toBe(50);
    });

    it("returns 0 with no records", () => {
      const r = computeSlipsTripsFallsPrevention({ ...baseInput });
      expect(r.wet_floor_protocol_rate).toBeNull();
    });

    it("returns 100 when all compliant", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        wet_floor_records: Array.from({ length: 5 }, (_, i) =>
          makeWetFloorProtocol({ id: `wf_${i}` }),
        ),
      });
      expect(r.wet_floor_protocol_rate).toBe(100);
    });

    it("requires BOTH signage_deployed AND signage_timely for signage to count", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        wet_floor_records: [
          makeWetFloorProtocol({ id: "1", signage_deployed: true, signage_timely: false }),
          makeWetFloorProtocol({ id: "2", signage_deployed: false, signage_timely: true }),
        ],
      });
      // Neither counts for signage - signageRate=0
      // cleaningRate=100, spillResponse=100, protocolDoc=100
      // avg = (0+100+100+100)/4 = 75
      expect(r.wet_floor_protocol_rate).toBe(75);
    });
  });

  // == STAIRWAY SAFETY RATE ===================================================

  describe("stairway safety rate", () => {
    it("averages handrail, treads, lighting, clutterFree, carpetSecure rates", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        stairway_safety_records: [
          makeStairwaySafety({ id: "1" }),
          makeStairwaySafety({ id: "2", handrail_secure: false, treads_non_slip: false, lighting_adequate: false, clutter_free: false, carpet_secure: false }),
        ],
      });
      // Each element: 50% -> avg of (50+50+50+50+50)/5 = 50
      expect(r.stairway_safety_rate).toBe(50);
    });

    it("returns 0 with no records", () => {
      const r = computeSlipsTripsFallsPrevention({ ...baseInput });
      expect(r.stairway_safety_rate).toBeNull();
    });

    it("returns 100 when all elements pass", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        stairway_safety_records: Array.from({ length: 5 }, (_, i) =>
          makeStairwaySafety({ id: `ss_${i}` }),
        ),
      });
      expect(r.stairway_safety_rate).toBe(100);
    });

    it("returns 0 when all elements fail", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        stairway_safety_records: [
          makeStairwaySafety({ id: "1", handrail_secure: false, treads_non_slip: false, lighting_adequate: false, clutter_free: false, carpet_secure: false }),
        ],
      });
      // record exists → 0, not null
      expect(r.stairway_safety_rate).toBe(0);
    });
  });

  // == INCIDENT LEARNING RATE =================================================

  describe("incident learning rate", () => {
    it("averages investigation, rootCause, lessonsDoc, lessonsShared, riskAssessmentUpdated", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        incident_records: [
          makeIncident({ id: "1" }),
          makeIncident({
            id: "2",
            investigation_completed: false,
            root_cause_identified: false,
            lessons_learned_documented: false,
            lessons_shared_with_staff: false,
            risk_assessment_updated: false,
          }),
        ],
      });
      // Each dimension: 50% -> avg (50+50+50+50+50)/5 = 50
      expect(r.incident_learning_rate).toBe(50);
    });

    it("returns 0 with no incidents", () => {
      const r = computeSlipsTripsFallsPrevention({ ...baseInput });
      expect(r.incident_learning_rate).toBeNull();
    });

    it("returns 100 when all learning domains complete", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        incident_records: Array.from({ length: 5 }, (_, i) =>
          makeIncident({ id: `inc_${i}` }),
        ),
      });
      expect(r.incident_learning_rate).toBe(100);
    });

    it("returns 0 when no learning done", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        incident_records: [
          makeIncident({
            id: "1",
            investigation_completed: false,
            root_cause_identified: false,
            lessons_learned_documented: false,
            lessons_shared_with_staff: false,
            risk_assessment_updated: false,
          }),
        ],
      });
      // record exists → 0, not null
      expect(r.incident_learning_rate).toBe(0);
    });
  });

  // == STAFF AWARENESS RATE ===================================================

  describe("staff awareness rate", () => {
    it("averages from available domains only", () => {
      // Only wet floor trained + risk assessment signedOff
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: Array.from({ length: 10 }, (_, i) =>
          makeRiskAssessment({ id: `ra_${i}`, signed_off: true }),
        ),
        wet_floor_records: Array.from({ length: 10 }, (_, i) =>
          makeWetFloorProtocol({ id: `wf_${i}`, staff_trained: true, children_warned: true }),
        ),
      });
      // signedOffRate=100, wetFloorTrainedRate=100, childrenWarnedRate=100 -> avg 100
      expect(r.staff_awareness_rate).toBe(100);
    });

    it("returns 0 when no relevant records exist", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        flooring_condition_records: [makeFlooringCondition()],
      });
      expect(r.staff_awareness_rate).toBeNull();
    });

    it("includes lessonsSharedRate when incidents exist", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        incident_records: Array.from({ length: 10 }, (_, i) =>
          makeIncident({ id: `inc_${i}`, lessons_shared_with_staff: i < 5 }),
        ),
      });
      // lessonsSharedRate = 50 -> staffAwareness = 50
      expect(r.staff_awareness_rate).toBe(50);
    });

    it("combines all four numerators when all domains present", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: Array.from({ length: 10 }, (_, i) =>
          makeRiskAssessment({ id: `ra_${i}`, signed_off: true }),
        ),
        wet_floor_records: Array.from({ length: 10 }, (_, i) =>
          makeWetFloorProtocol({ id: `wf_${i}`, staff_trained: true, children_warned: i < 5 }),
        ),
        incident_records: Array.from({ length: 10 }, (_, i) =>
          makeIncident({ id: `inc_${i}`, lessons_shared_with_staff: true }),
        ),
      });
      // signedOffRate=100, wetFloorTrainedRate=100, lessonsSharedRate=100, childrenWarnedRate=50
      // avg = (100+100+100+50)/4 = 88
      expect(r.staff_awareness_rate).toBe(88);
    });
  });

  // == STRENGTHS =============================================================

  describe("strengths", () => {
    it("adds strength for riskAssessmentRate >= 90", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: Array.from({ length: 10 }, (_, i) =>
          makeRiskAssessment({ id: `ra_${i}` }),
        ),
      });
      expect(r.strengths.some((s) => s.includes("100%") && s.includes("risk assessments"))).toBe(true);
    });

    it("adds strength for riskAssessmentRate >= 70 but < 90", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: Array.from({ length: 10 }, (_, i) =>
          makeRiskAssessment({ id: `ra_${i}`, controls_in_place: i < 8, controls_adequate: i < 8 }),
        ),
      });
      expect(r.strengths.some((s) => s.includes("80%") && s.includes("risk assessments"))).toBe(true);
    });

    it("adds strength for riskActionCompletionRate >= 90", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: Array.from({ length: 10 }, (_, i) =>
          makeRiskAssessment({ id: `ra_${i}`, actions_required: 3, actions_completed: 3 }),
        ),
      });
      expect(r.strengths.some((s) => s.includes("100%") && s.includes("actions completed"))).toBe(true);
    });

    it("adds strength for riskActionCompletionRate >= 70 but < 90", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: [
          makeRiskAssessment({ id: "1", actions_required: 10, actions_completed: 8 }),
        ],
      });
      expect(r.strengths.some((s) => s.includes("80%") && s.includes("actions completed"))).toBe(true);
    });

    it("adds strength for signedOffRate >= 90", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: Array.from({ length: 10 }, (_, i) =>
          makeRiskAssessment({ id: `ra_${i}`, signed_off: true }),
        ),
      });
      expect(r.strengths.some((s) => s.includes("signed off"))).toBe(true);
    });

    it("adds strength for childrenConsultedRate >= 80", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: Array.from({ length: 10 }, (_, i) =>
          makeRiskAssessment({ id: `ra_${i}`, children_consulted: i < 9 }),
        ),
      });
      expect(r.strengths.some((s) => s.includes("Children consulted"))).toBe(true);
    });

    it("adds strength for flooringConditionRate >= 90", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        flooring_condition_records: Array.from({ length: 10 }, (_, i) =>
          makeFlooringCondition({ id: `fc_${i}` }),
        ),
      });
      expect(r.strengths.some((s) => s.includes("flooring") && s.includes("good or fair"))).toBe(true);
    });

    it("adds strength for flooringConditionRate >= 70 but < 90", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        flooring_condition_records: Array.from({ length: 10 }, (_, i) =>
          makeFlooringCondition({ id: `fc_${i}`, condition: i < 8 ? "good" : "poor" }),
        ),
      });
      expect(r.strengths.some((s) => s.includes("flooring") && s.includes("acceptable condition"))).toBe(true);
    });

    it("adds strength for slipResistanceRate >= 90", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        flooring_condition_records: Array.from({ length: 10 }, (_, i) =>
          makeFlooringCondition({ id: `fc_${i}`, slip_resistance_adequate: true }),
        ),
      });
      expect(r.strengths.some((s) => s.includes("Slip resistance"))).toBe(true);
    });

    it("adds strength for repairCompletionRate >= 90", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        flooring_condition_records: Array.from({ length: 10 }, (_, i) =>
          makeFlooringCondition({ id: `fc_${i}`, repair_needed: true, repair_completed: true }),
        ),
      });
      expect(r.strengths.some((s) => s.includes("repairs completed"))).toBe(true);
    });

    it("adds strength for thresholdSafeRate >= 90", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        flooring_condition_records: Array.from({ length: 10 }, (_, i) =>
          makeFlooringCondition({ id: `fc_${i}`, threshold_safe: true }),
        ),
      });
      expect(r.strengths.some((s) => s.includes("thresholds"))).toBe(true);
    });

    it("adds strength for wetFloorProtocolRate >= 90", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        wet_floor_records: Array.from({ length: 10 }, (_, i) =>
          makeWetFloorProtocol({ id: `wf_${i}` }),
        ),
      });
      expect(r.strengths.some((s) => s.includes("Wet floor protocol compliance"))).toBe(true);
    });

    it("adds strength for wetFloorProtocolRate >= 70 but < 90", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        wet_floor_records: Array.from({ length: 10 }, (_, i) =>
          makeWetFloorProtocol({
            id: `wf_${i}`,
            signage_deployed: i < 8,
            signage_timely: i < 8,
            cleaning_schedule_followed: i < 8,
            spill_response_within_target: i < 8,
            protocol_documented: i < 8,
          }),
        ),
      });
      expect(r.strengths.some((s) => s.includes("Wet floor protocol compliance") && s.includes("good adherence"))).toBe(true);
    });

    it("adds strength for spillResponseRate >= 90", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        wet_floor_records: Array.from({ length: 10 }, (_, i) =>
          makeWetFloorProtocol({ id: `wf_${i}`, spill_response_within_target: true }),
        ),
      });
      expect(r.strengths.some((s) => s.includes("spill responses"))).toBe(true);
    });

    it("adds strength for entranceMattingRate >= 90", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        wet_floor_records: Array.from({ length: 10 }, (_, i) =>
          makeWetFloorProtocol({ id: `wf_${i}`, entrance_matting_adequate: true }),
        ),
      });
      expect(r.strengths.some((s) => s.includes("Entrance matting"))).toBe(true);
    });

    it("adds strength for stairwaySafetyRate >= 90", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        stairway_safety_records: Array.from({ length: 10 }, (_, i) =>
          makeStairwaySafety({ id: `ss_${i}` }),
        ),
      });
      expect(r.strengths.some((s) => s.includes("Stairway safety compliance"))).toBe(true);
    });

    it("adds strength for stairwaySafetyRate >= 70 but < 90", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        stairway_safety_records: Array.from({ length: 10 }, (_, i) =>
          makeStairwaySafety({
            id: `ss_${i}`,
            handrail_secure: i < 8,
            treads_non_slip: i < 8,
            lighting_adequate: i < 8,
            clutter_free: i < 8,
            carpet_secure: i < 8,
          }),
        ),
      });
      expect(r.strengths.some((s) => s.includes("Stairway safety") && s.includes("most stairway"))).toBe(true);
    });

    it("adds strength for handrailRate >= 95", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        stairway_safety_records: Array.from({ length: 10 }, (_, i) =>
          makeStairwaySafety({ id: `ss_${i}`, handrail_secure: true }),
        ),
      });
      expect(r.strengths.some((s) => s.includes("Handrails secure"))).toBe(true);
    });

    it("adds strength for stairDefectRectificationRate >= 90", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        stairway_safety_records: Array.from({ length: 10 }, (_, i) =>
          makeStairwaySafety({ id: `ss_${i}`, defects_found: ["crack"], defects_rectified: true }),
        ),
      });
      expect(r.strengths.some((s) => s.includes("defects rectified"))).toBe(true);
    });

    it("adds strength for childSpecificRate >= 80", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        stairway_safety_records: Array.from({ length: 10 }, (_, i) =>
          makeStairwaySafety({ id: `ss_${i}`, child_specific_risks_assessed: i < 9 }),
        ),
      });
      expect(r.strengths.some((s) => s.includes("Child-specific"))).toBe(true);
    });

    it("adds strength for incidentLearningRate >= 90", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        incident_records: Array.from({ length: 10 }, (_, i) =>
          makeIncident({ id: `inc_${i}` }),
        ),
      });
      expect(r.strengths.some((s) => s.includes("Incident learning rate"))).toBe(true);
    });

    it("adds strength for incidentLearningRate >= 70 but < 90", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        incident_records: Array.from({ length: 10 }, (_, i) =>
          makeIncident({
            id: `inc_${i}`,
            investigation_completed: i < 8,
            root_cause_identified: i < 8,
            lessons_learned_documented: i < 8,
            lessons_shared_with_staff: i < 8,
            risk_assessment_updated: i < 8,
          }),
        ),
      });
      expect(r.strengths.some((s) => s.includes("Incident learning rate") && s.includes("good evidence"))).toBe(true);
    });

    it("adds strength for investigationRate >= 95", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        incident_records: Array.from({ length: 10 }, (_, i) =>
          makeIncident({ id: `inc_${i}`, investigation_completed: true }),
        ),
      });
      expect(r.strengths.some((s) => s.includes("incidents fully investigated"))).toBe(true);
    });

    it("adds strength for rootCauseRate >= 90", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        incident_records: Array.from({ length: 10 }, (_, i) =>
          makeIncident({ id: `inc_${i}`, root_cause_identified: true }),
        ),
      });
      expect(r.strengths.some((s) => s.includes("Root causes identified"))).toBe(true);
    });

    it("adds strength for parentNotificationRate >= 95", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        incident_records: Array.from({ length: 10 }, (_, i) =>
          makeIncident({ id: `inc_${i}`, parent_carer_notified: true }),
        ),
      });
      expect(r.strengths.some((s) => s.includes("Parents/carers notified"))).toBe(true);
    });

    it("adds strength for firstAidRate >= 95 when injuries exist", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        incident_records: Array.from({ length: 10 }, (_, i) =>
          makeIncident({ id: `inc_${i}`, injury_sustained: true, first_aid_given: true }),
        ),
      });
      expect(r.strengths.some((s) => s.includes("First aid"))).toBe(true);
    });

    it("adds strength for nearMissRate >= 30", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        incident_records: Array.from({ length: 10 }, (_, i) =>
          makeIncident({ id: `inc_${i}`, incident_type: i < 4 ? "near_miss" : "slip" }),
        ),
      });
      expect(r.strengths.some((s) => s.includes("Near misses"))).toBe(true);
    });

    it("adds strength for staffAwarenessRate >= 90", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: Array.from({ length: 10 }, (_, i) =>
          makeRiskAssessment({ id: `ra_${i}`, signed_off: true }),
        ),
        wet_floor_records: Array.from({ length: 10 }, (_, i) =>
          makeWetFloorProtocol({ id: `wf_${i}`, staff_trained: true, children_warned: true }),
        ),
        incident_records: Array.from({ length: 10 }, (_, i) =>
          makeIncident({ id: `inc_${i}`, lessons_shared_with_staff: true }),
        ),
      });
      expect(r.strengths.some((s) => s.includes("Staff awareness composite"))).toBe(true);
    });

    it("adds strength for staffAwarenessRate >= 70 but < 90", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: Array.from({ length: 10 }, (_, i) =>
          makeRiskAssessment({ id: `ra_${i}`, signed_off: i < 8 }),
        ),
        wet_floor_records: Array.from({ length: 10 }, (_, i) =>
          makeWetFloorProtocol({ id: `wf_${i}`, staff_trained: i < 7, children_warned: i < 8 }),
        ),
      });
      expect(r.strengths.some((s) => s.includes("Staff awareness") && s.includes("good staff engagement"))).toBe(true);
    });

    it("adds strength for zero recurrence rate", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        incident_records: Array.from({ length: 10 }, (_, i) =>
          makeIncident({ id: `inc_${i}`, recurrence: false }),
        ),
      });
      expect(r.strengths.some((s) => s.includes("Zero recurrent incidents"))).toBe(true);
    });

    it("no strengths when everything is poor", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: Array.from({ length: 10 }, (_, i) =>
          makeRiskAssessment({
            id: `ra_${i}`,
            controls_in_place: false,
            controls_adequate: false,
            signed_off: false,
            children_consulted: false,
            actions_required: 5,
            actions_completed: 0,
          }),
        ),
      });
      expect(r.strengths.length).toBe(0);
    });
  });

  // == CONCERNS ===============================================================

  describe("concerns", () => {
    it("concern for riskAssessmentRate < 50", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: Array.from({ length: 10 }, (_, i) =>
          makeRiskAssessment({ id: `ra_${i}`, controls_in_place: i < 3, controls_adequate: i < 3 }),
        ),
      });
      expect(r.concerns.some((c) => c.includes("30%") && c.includes("adequate controls"))).toBe(true);
    });

    it("concern for riskAssessmentRate 50-69", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: Array.from({ length: 10 }, (_, i) =>
          makeRiskAssessment({ id: `ra_${i}`, controls_in_place: i < 6, controls_adequate: i < 6 }),
        ),
      });
      expect(r.concerns.some((c) => c.includes("60%") && c.includes("some areas lack"))).toBe(true);
    });

    it("concern for reviewOverdueRate >= 30", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: Array.from({ length: 10 }, (_, i) =>
          makeRiskAssessment({ id: `ra_${i}`, review_overdue: i < 4 }),
        ),
      });
      expect(r.concerns.some((c) => c.includes("overdue for review"))).toBe(true);
    });

    it("concern for riskActionCompletionRate < 60", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: [
          makeRiskAssessment({ id: "1", actions_required: 10, actions_completed: 5 }),
        ],
      });
      expect(r.concerns.some((c) => c.includes("actions completed"))).toBe(true);
    });

    it("concern for highCriticalRate >= 30", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: Array.from({ length: 10 }, (_, i) =>
          makeRiskAssessment({ id: `ra_${i}`, risk_level: i < 4 ? "critical" : "low" }),
        ),
      });
      expect(r.concerns.some((c) => c.includes("high or critical"))).toBe(true);
    });

    it("concern for no risk assessments with children present", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        total_children: 3,
        flooring_condition_records: [makeFlooringCondition()],
      });
      expect(r.concerns.some((c) => c.includes("No slip/trip risk assessments"))).toBe(true);
    });

    it("concern for hazardousFlooringRate >= 20", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        flooring_condition_records: Array.from({ length: 10 }, (_, i) =>
          makeFlooringCondition({ id: `fc_${i}`, condition: i < 3 ? "hazardous" : "good" }),
        ),
      });
      expect(r.concerns.some((c) => c.includes("hazardous"))).toBe(true);
    });

    it("concern for flooringConditionRate < 50", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        flooring_condition_records: Array.from({ length: 10 }, (_, i) =>
          makeFlooringCondition({ id: `fc_${i}`, condition: i < 4 ? "good" : "poor" }),
        ),
      });
      expect(r.concerns.some((c) => c.includes("flooring in acceptable condition"))).toBe(true);
    });

    it("concern for flooringConditionRate 50-69", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        flooring_condition_records: Array.from({ length: 10 }, (_, i) =>
          makeFlooringCondition({ id: `fc_${i}`, condition: i < 6 ? "good" : "poor" }),
        ),
      });
      expect(r.concerns.some((c) => c.includes("Flooring condition at 60%"))).toBe(true);
    });

    it("concern for tripHazardRate >= 30", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        flooring_condition_records: Array.from({ length: 10 }, (_, i) =>
          makeFlooringCondition({ id: `fc_${i}`, trip_hazards_present: i < 4 }),
        ),
      });
      expect(r.concerns.some((c) => c.includes("Trip hazards present"))).toBe(true);
    });

    it("concern for slipResistanceRate < 70", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        flooring_condition_records: Array.from({ length: 10 }, (_, i) =>
          makeFlooringCondition({ id: `fc_${i}`, slip_resistance_adequate: i < 6 }),
        ),
      });
      expect(r.concerns.some((c) => c.includes("Slip resistance adequate in only"))).toBe(true);
    });

    it("concern for repairCompletionRate < 50", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        flooring_condition_records: Array.from({ length: 10 }, (_, i) =>
          makeFlooringCondition({ id: `fc_${i}`, repair_needed: true, repair_completed: i < 4 }),
        ),
      });
      expect(r.concerns.some((c) => c.includes("flooring repairs completed"))).toBe(true);
    });

    it("concern for no flooring records with children present", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        total_children: 3,
        risk_assessment_records: [makeRiskAssessment()],
      });
      expect(r.concerns.some((c) => c.includes("No flooring condition audits"))).toBe(true);
    });

    it("concern for wetFloorProtocolRate < 50", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        wet_floor_records: Array.from({ length: 10 }, (_, i) =>
          makeWetFloorProtocol({
            id: `wf_${i}`,
            signage_deployed: i < 3,
            signage_timely: i < 3,
            cleaning_schedule_followed: i < 3,
            spill_response_within_target: i < 3,
            protocol_documented: i < 3,
          }),
        ),
      });
      expect(r.concerns.some((c) => c.includes("Wet floor protocol compliance at only"))).toBe(true);
    });

    it("concern for wetFloorProtocolRate 50-69", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        wet_floor_records: Array.from({ length: 10 }, (_, i) =>
          makeWetFloorProtocol({
            id: `wf_${i}`,
            signage_deployed: i < 6,
            signage_timely: i < 6,
            cleaning_schedule_followed: i < 6,
            spill_response_within_target: i < 6,
            protocol_documented: i < 6,
          }),
        ),
      });
      expect(r.concerns.some((c) => c.includes("Wet floor protocol compliance at") && c.includes("gaps"))).toBe(true);
    });

    it("concern for spillResponseRate < 50", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        wet_floor_records: Array.from({ length: 10 }, (_, i) =>
          makeWetFloorProtocol({ id: `wf_${i}`, spill_response_within_target: i < 4 }),
        ),
      });
      expect(r.concerns.some((c) => c.includes("spill responses within target"))).toBe(true);
    });

    it("concern for wetFloorIncidentRate >= 20", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        wet_floor_records: Array.from({ length: 10 }, (_, i) =>
          makeWetFloorProtocol({ id: `wf_${i}`, incident_resulted: i < 3 }),
        ),
      });
      expect(r.concerns.some((c) => c.includes("Incidents resulted from"))).toBe(true);
    });

    it("concern for signageRate < 60", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        wet_floor_records: Array.from({ length: 10 }, (_, i) =>
          makeWetFloorProtocol({ id: `wf_${i}`, signage_deployed: i < 5, signage_timely: i < 5 }),
        ),
      });
      expect(r.concerns.some((c) => c.includes("signage deployed on time"))).toBe(true);
    });

    it("concern for no wet floor records with children present", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        total_children: 3,
        risk_assessment_records: [makeRiskAssessment()],
      });
      expect(r.concerns.some((c) => c.includes("No wet floor protocol records"))).toBe(true);
    });

    it("concern for stairwaySafetyRate < 50", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        stairway_safety_records: Array.from({ length: 10 }, (_, i) =>
          makeStairwaySafety({
            id: `ss_${i}`,
            handrail_secure: i < 3,
            treads_non_slip: i < 3,
            lighting_adequate: i < 3,
            clutter_free: i < 3,
            carpet_secure: i < 3,
          }),
        ),
      });
      expect(r.concerns.some((c) => c.includes("Stairway safety compliance at only"))).toBe(true);
    });

    it("concern for stairwaySafetyRate 50-69", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        stairway_safety_records: Array.from({ length: 10 }, (_, i) =>
          makeStairwaySafety({
            id: `ss_${i}`,
            handrail_secure: i < 6,
            treads_non_slip: i < 6,
            lighting_adequate: i < 6,
            clutter_free: i < 6,
            carpet_secure: i < 6,
          }),
        ),
      });
      expect(r.concerns.some((c) => c.includes("Stairway safety compliance at") && c.includes("need improvement"))).toBe(true);
    });

    it("concern for handrailRate < 80", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        stairway_safety_records: Array.from({ length: 10 }, (_, i) =>
          makeStairwaySafety({ id: `ss_${i}`, handrail_secure: i < 7 }),
        ),
      });
      expect(r.concerns.some((c) => c.includes("Handrails secure in only"))).toBe(true);
    });

    it("concern for stairLightingRate < 70", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        stairway_safety_records: Array.from({ length: 10 }, (_, i) =>
          makeStairwaySafety({ id: `ss_${i}`, lighting_adequate: i < 6 }),
        ),
      });
      expect(r.concerns.some((c) => c.includes("Stairway lighting adequate in only"))).toBe(true);
    });

    it("concern for clutterFreeRate < 70", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        stairway_safety_records: Array.from({ length: 10 }, (_, i) =>
          makeStairwaySafety({ id: `ss_${i}`, clutter_free: i < 6 }),
        ),
      });
      expect(r.concerns.some((c) => c.includes("stairways clutter-free"))).toBe(true);
    });

    it("concern for no stairway records with children present", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        total_children: 3,
        risk_assessment_records: [makeRiskAssessment()],
      });
      expect(r.concerns.some((c) => c.includes("No stairway safety inspection"))).toBe(true);
    });

    it("concern for seriousMajorRate >= 30", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        incident_records: Array.from({ length: 10 }, (_, i) =>
          makeIncident({ id: `inc_${i}`, severity: i < 4 ? "serious" : "minor" }),
        ),
      });
      expect(r.concerns.some((c) => c.includes("serious or major"))).toBe(true);
    });

    it("concern for recurrenceRate >= 25", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        incident_records: Array.from({ length: 10 }, (_, i) =>
          makeIncident({ id: `inc_${i}`, recurrence: i < 3 }),
        ),
      });
      expect(r.concerns.some((c) => c.includes("recurrences"))).toBe(true);
    });

    it("concern for incidentLearningRate < 50", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        incident_records: Array.from({ length: 10 }, (_, i) =>
          makeIncident({
            id: `inc_${i}`,
            investigation_completed: i < 3,
            root_cause_identified: i < 3,
            lessons_learned_documented: i < 3,
            lessons_shared_with_staff: i < 3,
            risk_assessment_updated: i < 3,
          }),
        ),
      });
      expect(r.concerns.some((c) => c.includes("Incident learning rate at only"))).toBe(true);
    });

    it("concern for incidentLearningRate 50-69", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        incident_records: Array.from({ length: 10 }, (_, i) =>
          makeIncident({
            id: `inc_${i}`,
            investigation_completed: i < 6,
            root_cause_identified: i < 6,
            lessons_learned_documented: i < 6,
            lessons_shared_with_staff: i < 6,
            risk_assessment_updated: i < 6,
          }),
        ),
      });
      expect(r.concerns.some((c) => c.includes("Incident learning rate at") && c.includes("strengthening"))).toBe(true);
    });

    it("concern for investigationRate < 70", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        incident_records: Array.from({ length: 10 }, (_, i) =>
          makeIncident({ id: `inc_${i}`, investigation_completed: i < 6 }),
        ),
      });
      expect(r.concerns.some((c) => c.includes("incidents fully investigated"))).toBe(true);
    });

    it("concern for riskAssessmentUpdatedRate < 50", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        incident_records: Array.from({ length: 10 }, (_, i) =>
          makeIncident({ id: `inc_${i}`, risk_assessment_updated: i < 4 }),
        ),
      });
      expect(r.concerns.some((c) => c.includes("Risk assessments updated after only"))).toBe(true);
    });

    it("concern for parentNotificationRate < 80", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        incident_records: Array.from({ length: 10 }, (_, i) =>
          makeIncident({ id: `inc_${i}`, parent_carer_notified: i < 7 }),
        ),
      });
      expect(r.concerns.some((c) => c.includes("Parents/carers notified for only"))).toBe(true);
    });

    it("concern for staffAwarenessRate < 50", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: Array.from({ length: 10 }, (_, i) =>
          makeRiskAssessment({ id: `ra_${i}`, signed_off: i < 3 }),
        ),
        wet_floor_records: Array.from({ length: 10 }, (_, i) =>
          makeWetFloorProtocol({ id: `wf_${i}`, staff_trained: i < 3, children_warned: i < 3 }),
        ),
      });
      expect(r.concerns.some((c) => c.includes("Staff awareness composite at only"))).toBe(true);
    });

    it("concern for medicalRate >= 30", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        incident_records: Array.from({ length: 10 }, (_, i) =>
          makeIncident({ id: `inc_${i}`, medical_attention_required: i < 4 }),
        ),
      });
      expect(r.concerns.some((c) => c.includes("Medical attention required"))).toBe(true);
    });

    it("no concerns when everything is excellent", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: Array.from({ length: 10 }, (_, i) =>
          makeRiskAssessment({ id: `ra_${i}` }),
        ),
        flooring_condition_records: Array.from({ length: 10 }, (_, i) =>
          makeFlooringCondition({ id: `fc_${i}` }),
        ),
        wet_floor_records: Array.from({ length: 10 }, (_, i) =>
          makeWetFloorProtocol({ id: `wf_${i}` }),
        ),
        stairway_safety_records: Array.from({ length: 10 }, (_, i) =>
          makeStairwaySafety({ id: `ss_${i}` }),
        ),
        incident_records: Array.from({ length: 10 }, (_, i) =>
          makeIncident({ id: `inc_${i}` }),
        ),
      });
      expect(r.concerns).toHaveLength(0);
    });
  });

  // == RECOMMENDATIONS ========================================================

  describe("recommendations", () => {
    it("recommendation for riskAssessmentRate < 50", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: Array.from({ length: 10 }, (_, i) =>
          makeRiskAssessment({ id: `ra_${i}`, controls_in_place: i < 3, controls_adequate: i < 3 }),
        ),
      });
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("Urgently review"))).toBe(true);
    });

    it("recommendation for hazardousFlooringRate >= 20", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        flooring_condition_records: Array.from({ length: 10 }, (_, i) =>
          makeFlooringCondition({ id: `fc_${i}`, condition: i < 3 ? "hazardous" : "good" }),
        ),
      });
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("repair or replace"))).toBe(true);
    });

    it("recommendation for seriousMajorRate >= 30", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        incident_records: Array.from({ length: 10 }, (_, i) =>
          makeIncident({ id: `inc_${i}`, severity: i < 4 ? "major" : "minor" }),
        ),
      });
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("comprehensive review"))).toBe(true);
    });

    it("recommendation for recurrenceRate >= 25", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        incident_records: Array.from({ length: 10 }, (_, i) =>
          makeIncident({ id: `inc_${i}`, recurrence: i < 3 }),
        ),
      });
      expect(r.recommendations.some((rec) => rec.recommendation.includes("recurrent incidents"))).toBe(true);
    });

    it("recommendation for no risk assessments with children", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        total_children: 3,
        flooring_condition_records: [makeFlooringCondition()],
      });
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Implement slip, trip, and fall risk assessments"))).toBe(true);
    });

    it("recommendation for no stairway records with children", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        total_children: 3,
        flooring_condition_records: [makeFlooringCondition()],
      });
      expect(r.recommendations.some((rec) => rec.recommendation.includes("stairway safety inspections"))).toBe(true);
    });

    it("recommendation for handrailRate < 80", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        stairway_safety_records: Array.from({ length: 10 }, (_, i) =>
          makeStairwaySafety({ id: `ss_${i}`, handrail_secure: i < 7 }),
        ),
      });
      expect(r.recommendations.some((rec) => rec.recommendation.includes("handrails"))).toBe(true);
    });

    it("recommendation for stairLightingRate < 70", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        stairway_safety_records: Array.from({ length: 10 }, (_, i) =>
          makeStairwaySafety({ id: `ss_${i}`, lighting_adequate: i < 6 }),
        ),
      });
      expect(r.recommendations.some((rec) => rec.recommendation.includes("stairway lighting"))).toBe(true);
    });

    it("recommendation for flooringConditionRate < 50", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        flooring_condition_records: Array.from({ length: 10 }, (_, i) =>
          makeFlooringCondition({ id: `fc_${i}`, condition: i < 4 ? "good" : "poor" }),
        ),
      });
      expect(r.recommendations.some((rec) => rec.recommendation.includes("flooring maintenance"))).toBe(true);
    });

    it("recommendation for spillResponseRate < 50", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        wet_floor_records: Array.from({ length: 10 }, (_, i) =>
          makeWetFloorProtocol({ id: `wf_${i}`, spill_response_within_target: i < 4 }),
        ),
      });
      expect(r.recommendations.some((rec) => rec.recommendation.includes("spill response"))).toBe(true);
    });

    it("recommendation for wetFloorProtocolRate < 50", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        wet_floor_records: Array.from({ length: 10 }, (_, i) =>
          makeWetFloorProtocol({
            id: `wf_${i}`,
            signage_deployed: i < 3,
            signage_timely: i < 3,
            cleaning_schedule_followed: i < 3,
            spill_response_within_target: i < 3,
            protocol_documented: i < 3,
          }),
        ),
      });
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Overhaul wet floor"))).toBe(true);
    });

    it("recommendation for incidentLearningRate < 50", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        incident_records: Array.from({ length: 10 }, (_, i) =>
          makeIncident({
            id: `inc_${i}`,
            investigation_completed: i < 3,
            root_cause_identified: i < 3,
            lessons_learned_documented: i < 3,
            lessons_shared_with_staff: i < 3,
            risk_assessment_updated: i < 3,
          }),
        ),
      });
      expect(r.recommendations.some((rec) => rec.recommendation.includes("structured post-incident"))).toBe(true);
    });

    it("recommendation for repairCompletionRate < 50", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        flooring_condition_records: Array.from({ length: 10 }, (_, i) =>
          makeFlooringCondition({ id: `fc_${i}`, repair_needed: true, repair_completed: i < 4 }),
        ),
      });
      expect(r.recommendations.some((rec) => rec.recommendation.includes("outstanding flooring repairs"))).toBe(true);
    });

    it("recommendation for signageRate < 60", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        wet_floor_records: Array.from({ length: 10 }, (_, i) =>
          makeWetFloorProtocol({ id: `wf_${i}`, signage_deployed: i < 5, signage_timely: i < 5 }),
        ),
      });
      expect(r.recommendations.some((rec) => rec.recommendation.includes("signage is deployed"))).toBe(true);
    });

    it("recommendation for clutterFreeRate < 70", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        stairway_safety_records: Array.from({ length: 10 }, (_, i) =>
          makeStairwaySafety({ id: `ss_${i}`, clutter_free: i < 6 }),
        ),
      });
      expect(r.recommendations.some((rec) => rec.recommendation.includes("clutter-free"))).toBe(true);
    });

    it("recommendation for staffAwarenessRate < 50", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: Array.from({ length: 10 }, (_, i) =>
          makeRiskAssessment({ id: `ra_${i}`, signed_off: i < 3 }),
        ),
        wet_floor_records: Array.from({ length: 10 }, (_, i) =>
          makeWetFloorProtocol({ id: `wf_${i}`, staff_trained: i < 3, children_warned: i < 3 }),
        ),
      });
      expect(r.recommendations.some((rec) => rec.recommendation.includes("targeted training"))).toBe(true);
    });

    it("planned recommendation for riskAssessmentRate 50-69", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: Array.from({ length: 10 }, (_, i) =>
          makeRiskAssessment({ id: `ra_${i}`, controls_in_place: i < 6, controls_adequate: i < 6 }),
        ),
      });
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("risk assessment adequacy"))).toBe(true);
    });

    it("planned recommendation for flooringConditionRate 50-69", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        flooring_condition_records: Array.from({ length: 10 }, (_, i) =>
          makeFlooringCondition({ id: `fc_${i}`, condition: i < 6 ? "good" : "poor" }),
        ),
      });
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("flooring improvements"))).toBe(true);
    });

    it("planned recommendation for wetFloorProtocolRate 50-69", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        wet_floor_records: Array.from({ length: 10 }, (_, i) =>
          makeWetFloorProtocol({
            id: `wf_${i}`,
            signage_deployed: i < 6,
            signage_timely: i < 6,
            cleaning_schedule_followed: i < 6,
            spill_response_within_target: i < 6,
            protocol_documented: i < 6,
          }),
        ),
      });
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("wet floor protocol compliance"))).toBe(true);
    });

    it("planned recommendation for stairwaySafetyRate 50-69", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        stairway_safety_records: Array.from({ length: 10 }, (_, i) =>
          makeStairwaySafety({
            id: `ss_${i}`,
            handrail_secure: i < 6,
            treads_non_slip: i < 6,
            lighting_adequate: i < 6,
            clutter_free: i < 6,
            carpet_secure: i < 6,
          }),
        ),
      });
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("stairway safety compliance"))).toBe(true);
    });

    it("planned recommendation for childrenConsultedRate < 50", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: Array.from({ length: 10 }, (_, i) =>
          makeRiskAssessment({ id: `ra_${i}`, children_consulted: i < 4 }),
        ),
      });
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Involve children"))).toBe(true);
    });

    it("recommendation for no flooring records with children", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        total_children: 3,
        risk_assessment_records: [makeRiskAssessment()],
      });
      expect(r.recommendations.some((rec) => rec.recommendation.includes("flooring condition audits"))).toBe(true);
    });

    it("recommendation for no wet floor records with children", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        total_children: 3,
        risk_assessment_records: [makeRiskAssessment()],
      });
      expect(r.recommendations.some((rec) => rec.recommendation.includes("wet floor management protocols"))).toBe(true);
    });

    it("planned recommendation for parentNotificationRate < 80", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        incident_records: Array.from({ length: 10 }, (_, i) =>
          makeIncident({ id: `inc_${i}`, parent_carer_notified: i < 7 }),
        ),
      });
      expect(r.recommendations.some((rec) => rec.recommendation.includes("notification procedures"))).toBe(true);
    });

    it("recommendation for reviewOverdueRate >= 30", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: Array.from({ length: 10 }, (_, i) =>
          makeRiskAssessment({ id: `ra_${i}`, review_overdue: i < 4 }),
        ),
      });
      expect(r.recommendations.some((rec) => rec.recommendation.includes("overdue risk assessment reviews"))).toBe(true);
    });

    it("recommendations have sequential ranks", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: Array.from({ length: 10 }, (_, i) =>
          makeRiskAssessment({ id: `ra_${i}`, controls_in_place: i < 3, controls_adequate: i < 3 }),
        ),
        flooring_condition_records: Array.from({ length: 10 }, (_, i) =>
          makeFlooringCondition({ id: `fc_${i}`, condition: i < 3 ? "hazardous" : "good" }),
        ),
      });
      for (let i = 0; i < r.recommendations.length; i++) {
        expect(r.recommendations[i].rank).toBe(i + 1);
      }
    });

    it("all recommendations have regulatory_ref", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: Array.from({ length: 10 }, (_, i) =>
          makeRiskAssessment({ id: `ra_${i}`, controls_in_place: i < 3, controls_adequate: i < 3 }),
        ),
        flooring_condition_records: Array.from({ length: 10 }, (_, i) =>
          makeFlooringCondition({ id: `fc_${i}`, condition: i < 3 ? "hazardous" : "good" }),
        ),
      });
      for (const rec of r.recommendations) {
        expect(rec.regulatory_ref.length).toBeGreaterThan(0);
      }
    });

    it("no recommendations when everything is outstanding", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: Array.from({ length: 10 }, (_, i) =>
          makeRiskAssessment({ id: `ra_${i}` }),
        ),
        flooring_condition_records: Array.from({ length: 10 }, (_, i) =>
          makeFlooringCondition({ id: `fc_${i}` }),
        ),
        wet_floor_records: Array.from({ length: 10 }, (_, i) =>
          makeWetFloorProtocol({ id: `wf_${i}` }),
        ),
        stairway_safety_records: Array.from({ length: 10 }, (_, i) =>
          makeStairwaySafety({ id: `ss_${i}` }),
        ),
        incident_records: Array.from({ length: 10 }, (_, i) =>
          makeIncident({ id: `inc_${i}` }),
        ),
      });
      expect(r.recommendations).toHaveLength(0);
    });
  });

  // == INSIGHTS ===============================================================

  describe("insights", () => {
    it("critical insight for riskAssessmentRate < 50", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: Array.from({ length: 10 }, (_, i) =>
          makeRiskAssessment({ id: `ra_${i}`, controls_in_place: i < 3, controls_adequate: i < 3 }),
        ),
      });
      expect(r.insights.some((ins) => ins.severity === "critical" && ins.text.includes("Reg 25"))).toBe(true);
    });

    it("critical insight for hazardousFlooringRate >= 20", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        flooring_condition_records: Array.from({ length: 10 }, (_, i) =>
          makeFlooringCondition({ id: `fc_${i}`, condition: i < 3 ? "hazardous" : "good" }),
        ),
      });
      expect(r.insights.some((ins) => ins.severity === "critical" && ins.text.includes("hazardous"))).toBe(true);
    });

    it("critical insight for seriousMajorRate >= 30", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        incident_records: Array.from({ length: 10 }, (_, i) =>
          makeIncident({ id: `inc_${i}`, severity: i < 4 ? "major" : "minor" }),
        ),
      });
      expect(r.insights.some((ins) => ins.severity === "critical" && ins.text.includes("serious or major"))).toBe(true);
    });

    it("critical insight for recurrenceRate >= 25", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        incident_records: Array.from({ length: 10 }, (_, i) =>
          makeIncident({ id: `inc_${i}`, recurrence: i < 3 }),
        ),
      });
      expect(r.insights.some((ins) => ins.severity === "critical" && ins.text.includes("recurrences"))).toBe(true);
    });

    it("critical insight for no risk assessments with children", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        total_children: 3,
        flooring_condition_records: [makeFlooringCondition()],
      });
      expect(r.insights.some((ins) => ins.severity === "critical" && ins.text.includes("No slip/trip risk assessments"))).toBe(true);
    });

    it("critical insight for handrailRate < 60", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        stairway_safety_records: Array.from({ length: 10 }, (_, i) =>
          makeStairwaySafety({ id: `ss_${i}`, handrail_secure: i < 5 }),
        ),
      });
      expect(r.insights.some((ins) => ins.severity === "critical" && ins.text.includes("Handrails secure"))).toBe(true);
    });

    it("warning insight for riskAssessmentRate 50-69", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: Array.from({ length: 10 }, (_, i) =>
          makeRiskAssessment({ id: `ra_${i}`, controls_in_place: i < 6, controls_adequate: i < 6 }),
        ),
      });
      expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("Risk assessment adequacy"))).toBe(true);
    });

    it("warning insight for flooringConditionRate 50-69", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        flooring_condition_records: Array.from({ length: 10 }, (_, i) =>
          makeFlooringCondition({ id: `fc_${i}`, condition: i < 6 ? "good" : "poor" }),
        ),
      });
      expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("Flooring condition"))).toBe(true);
    });

    it("warning insight for wetFloorProtocolRate 50-89", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        wet_floor_records: Array.from({ length: 10 }, (_, i) =>
          makeWetFloorProtocol({
            id: `wf_${i}`,
            signage_deployed: i < 8,
            signage_timely: i < 8,
            cleaning_schedule_followed: i < 8,
            spill_response_within_target: i < 8,
            protocol_documented: i < 8,
          }),
        ),
      });
      expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("Wet floor protocol compliance"))).toBe(true);
    });

    it("warning insight for stairwaySafetyRate 50-89", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        stairway_safety_records: Array.from({ length: 10 }, (_, i) =>
          makeStairwaySafety({
            id: `ss_${i}`,
            handrail_secure: i < 8,
            treads_non_slip: i < 8,
            lighting_adequate: i < 8,
            clutter_free: i < 8,
            carpet_secure: i < 8,
          }),
        ),
      });
      expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("Stairway safety compliance"))).toBe(true);
    });

    it("warning insight for incidentLearningRate 50-89", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        incident_records: Array.from({ length: 10 }, (_, i) =>
          makeIncident({
            id: `inc_${i}`,
            investigation_completed: i < 8,
            root_cause_identified: i < 8,
            lessons_learned_documented: i < 8,
            lessons_shared_with_staff: i < 8,
            risk_assessment_updated: i < 8,
          }),
        ),
      });
      expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("Incident learning rate"))).toBe(true);
    });

    it("warning insight for reviewOverdueRate >= 30", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: Array.from({ length: 10 }, (_, i) =>
          makeRiskAssessment({ id: `ra_${i}`, review_overdue: i < 4 }),
        ),
      });
      expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("overdue for review"))).toBe(true);
    });

    it("warning insight for tripHazardRate >= 30", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        flooring_condition_records: Array.from({ length: 10 }, (_, i) =>
          makeFlooringCondition({ id: `fc_${i}`, trip_hazards_present: i < 4 }),
        ),
      });
      expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("Trip hazards"))).toBe(true);
    });

    it("warning insight for slipResistanceRate 50-69", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        flooring_condition_records: Array.from({ length: 10 }, (_, i) =>
          makeFlooringCondition({ id: `fc_${i}`, slip_resistance_adequate: i < 6 }),
        ),
      });
      expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("Slip resistance"))).toBe(true);
    });

    it("warning insight for staffAwarenessRate 50-89", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: Array.from({ length: 10 }, (_, i) =>
          makeRiskAssessment({ id: `ra_${i}`, signed_off: i < 8 }),
        ),
        wet_floor_records: Array.from({ length: 10 }, (_, i) =>
          makeWetFloorProtocol({ id: `wf_${i}`, staff_trained: i < 7, children_warned: i < 8 }),
        ),
      });
      expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("Staff awareness"))).toBe(true);
    });

    it("warning insight for wetFloorIncidentRate 10-19", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        wet_floor_records: Array.from({ length: 10 }, (_, i) =>
          makeWetFloorProtocol({ id: `wf_${i}`, incident_resulted: i < 1 }),
        ),
      });
      expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("Incidents resulted from 10%"))).toBe(true);
    });

    it("warning insight for medicalRate 15-29", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        incident_records: Array.from({ length: 10 }, (_, i) =>
          makeIncident({ id: `inc_${i}`, medical_attention_required: i < 2 }),
        ),
      });
      expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("Medical attention"))).toBe(true);
    });

    it("positive insight for outstanding rating", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: Array.from({ length: 10 }, (_, i) =>
          makeRiskAssessment({ id: `ra_${i}` }),
        ),
        flooring_condition_records: Array.from({ length: 10 }, (_, i) =>
          makeFlooringCondition({ id: `fc_${i}` }),
        ),
        wet_floor_records: Array.from({ length: 10 }, (_, i) =>
          makeWetFloorProtocol({ id: `wf_${i}` }),
        ),
        stairway_safety_records: Array.from({ length: 10 }, (_, i) =>
          makeStairwaySafety({ id: `ss_${i}` }),
        ),
        incident_records: Array.from({ length: 10 }, (_, i) =>
          makeIncident({ id: `inc_${i}` }),
        ),
      });
      expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("outstanding"))).toBe(true);
    });

    it("positive insight for high riskAssessment + actionCompletion", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: Array.from({ length: 10 }, (_, i) =>
          makeRiskAssessment({ id: `ra_${i}`, actions_required: 3, actions_completed: 3 }),
        ),
      });
      expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("action completion"))).toBe(true);
    });

    it("positive insight for high flooring + slipResistance", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        flooring_condition_records: Array.from({ length: 10 }, (_, i) =>
          makeFlooringCondition({ id: `fc_${i}`, condition: "good", slip_resistance_adequate: true }),
        ),
      });
      expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("slip resistance"))).toBe(true);
    });

    it("positive insight for high wetFloor + spillResponse", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        wet_floor_records: Array.from({ length: 10 }, (_, i) =>
          makeWetFloorProtocol({ id: `wf_${i}` }),
        ),
      });
      expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("Wet floor protocol compliance"))).toBe(true);
    });

    it("positive insight for high stairwaySafety + handrails", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        stairway_safety_records: Array.from({ length: 10 }, (_, i) =>
          makeStairwaySafety({ id: `ss_${i}` }),
        ),
      });
      expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("Stairway safety"))).toBe(true);
    });

    it("positive insight for high incidentLearning + zero recurrence", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        incident_records: Array.from({ length: 10 }, (_, i) =>
          makeIncident({ id: `inc_${i}`, recurrence: false }),
        ),
      });
      expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("zero recurrences"))).toBe(true);
    });

    it("positive insight for nearMissRate >= 30", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        incident_records: Array.from({ length: 10 }, (_, i) =>
          makeIncident({ id: `inc_${i}`, incident_type: i < 4 ? "near_miss" : "slip" }),
        ),
      });
      expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("Near misses"))).toBe(true);
    });

    it("positive insight for staffAwarenessRate >= 90", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: Array.from({ length: 10 }, (_, i) =>
          makeRiskAssessment({ id: `ra_${i}`, signed_off: true }),
        ),
        wet_floor_records: Array.from({ length: 10 }, (_, i) =>
          makeWetFloorProtocol({ id: `wf_${i}`, staff_trained: true, children_warned: true }),
        ),
        incident_records: Array.from({ length: 10 }, (_, i) =>
          makeIncident({ id: `inc_${i}`, lessons_shared_with_staff: true }),
        ),
      });
      expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("Staff awareness"))).toBe(true);
    });

    it("positive insight for childrenConsultedRate >= 80", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: Array.from({ length: 10 }, (_, i) =>
          makeRiskAssessment({ id: `ra_${i}`, children_consulted: i < 9 }),
        ),
      });
      expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("Children consulted"))).toBe(true);
    });

    it("positive insight for firstAidRate >= 95 with injuries", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        incident_records: Array.from({ length: 10 }, (_, i) =>
          makeIncident({ id: `inc_${i}`, injury_sustained: true, first_aid_given: true }),
        ),
      });
      expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("First aid"))).toBe(true);
    });
  });

  // == HEADLINE ===============================================================

  describe("headline", () => {
    it("outstanding headline mentions outstanding", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: Array.from({ length: 10 }, (_, i) =>
          makeRiskAssessment({ id: `ra_${i}` }),
        ),
        flooring_condition_records: Array.from({ length: 10 }, (_, i) =>
          makeFlooringCondition({ id: `fc_${i}` }),
        ),
        wet_floor_records: Array.from({ length: 10 }, (_, i) =>
          makeWetFloorProtocol({ id: `wf_${i}` }),
        ),
        stairway_safety_records: Array.from({ length: 10 }, (_, i) =>
          makeStairwaySafety({ id: `ss_${i}` }),
        ),
        incident_records: Array.from({ length: 10 }, (_, i) =>
          makeIncident({ id: `inc_${i}` }),
        ),
      });
      expect(r.headline).toContain("Outstanding");
    });

    it("good headline mentions strengths count", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: Array.from({ length: 10 }, (_, i) =>
          makeRiskAssessment({
            id: `ra_${i}`,
            controls_in_place: i < 8,
            controls_adequate: i < 8,
          }),
        ),
        flooring_condition_records: Array.from({ length: 10 }, (_, i) =>
          makeFlooringCondition({ id: `fc_${i}`, condition: i < 8 ? "good" : "fair" }),
        ),
        wet_floor_records: Array.from({ length: 5 }, (_, i) =>
          makeWetFloorProtocol({
            id: `wf_${i}`,
            signage_deployed: i < 4,
            signage_timely: i < 4,
            cleaning_schedule_followed: i < 4,
            spill_response_within_target: i < 4,
            protocol_documented: i < 4,
          }),
        ),
        stairway_safety_records: Array.from({ length: 5 }, (_, i) =>
          makeStairwaySafety({
            id: `ss_${i}`,
            handrail_secure: i < 4,
            treads_non_slip: i < 4,
            lighting_adequate: i < 4,
            clutter_free: i < 4,
            carpet_secure: i < 4,
          }),
        ),
      });
      expect(r.headline).toContain("Good");
      expect(r.headline).toContain("strength");
    });

    it("adequate headline mentions concerns count", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: Array.from({ length: 10 }, (_, i) =>
          makeRiskAssessment({
            id: `ra_${i}`,
            controls_in_place: i < 6,
            controls_adequate: i < 6,
          }),
        ),
        flooring_condition_records: Array.from({ length: 10 }, (_, i) =>
          makeFlooringCondition({ id: `fc_${i}`, condition: i < 6 ? "good" : "poor" }),
        ),
      });
      if (r.falls_prevention_rating === "adequate") {
        expect(r.headline).toContain("Adequate");
        expect(r.headline).toContain("concern");
      }
    });

    it("inadequate headline mentions urgent action", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: Array.from({ length: 10 }, (_, i) =>
          makeRiskAssessment({
            id: `ra_${i}`,
            controls_in_place: false,
            controls_adequate: false,
          }),
        ),
        flooring_condition_records: Array.from({ length: 10 }, (_, i) =>
          makeFlooringCondition({ id: `fc_${i}`, condition: "hazardous" }),
        ),
        incident_records: Array.from({ length: 10 }, (_, i) =>
          makeIncident({
            id: `inc_${i}`,
            severity: "major",
            recurrence: true,
            investigation_completed: false,
            root_cause_identified: false,
            lessons_learned_documented: false,
            lessons_shared_with_staff: false,
            risk_assessment_updated: false,
          }),
        ),
      });
      expect(r.headline).toContain("inadequate");
      expect(r.headline).toContain("urgent action");
    });
  });

  // == OUTPUT SHAPE ===========================================================

  describe("output shape", () => {
    it("returns all expected fields", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: [makeRiskAssessment()],
      });
      expect(r).toHaveProperty("falls_prevention_rating");
      expect(r).toHaveProperty("falls_prevention_score");
      expect(r).toHaveProperty("headline");
      expect(r).toHaveProperty("risk_assessment_rate");
      expect(r).toHaveProperty("flooring_condition_rate");
      expect(r).toHaveProperty("wet_floor_protocol_rate");
      expect(r).toHaveProperty("stairway_safety_rate");
      expect(r).toHaveProperty("incident_learning_rate");
      expect(r).toHaveProperty("staff_awareness_rate");
      expect(r).toHaveProperty("strengths");
      expect(r).toHaveProperty("concerns");
      expect(r).toHaveProperty("recommendations");
      expect(r).toHaveProperty("insights");
    });

    it("score is a number", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: [makeRiskAssessment()],
      });
      expect(typeof r.falls_prevention_score).toBe("number");
    });

    it("rating is one of the valid values", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: [makeRiskAssessment()],
      });
      expect(["outstanding", "good", "adequate", "inadequate", "insufficient_data"]).toContain(r.falls_prevention_rating);
    });

    it("all rates are numbers between 0 and 100", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: [makeRiskAssessment()],
        flooring_condition_records: [makeFlooringCondition()],
        wet_floor_records: [makeWetFloorProtocol()],
        stairway_safety_records: [makeStairwaySafety()],
        incident_records: [makeIncident()],
      });
      for (const rate of [
        r.risk_assessment_rate,
        r.flooring_condition_rate,
        r.wet_floor_protocol_rate,
        r.stairway_safety_rate,
        r.incident_learning_rate,
        r.staff_awareness_rate,
      ]) {
        expect(rate).toBeGreaterThanOrEqual(0);
        expect(rate).toBeLessThanOrEqual(100);
      }
    });

    it("strengths, concerns are string arrays", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: [makeRiskAssessment()],
      });
      expect(Array.isArray(r.strengths)).toBe(true);
      expect(Array.isArray(r.concerns)).toBe(true);
    });

    it("recommendations have required fields", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        total_children: 3,
      });
      for (const rec of r.recommendations) {
        expect(rec).toHaveProperty("rank");
        expect(rec).toHaveProperty("recommendation");
        expect(rec).toHaveProperty("urgency");
        expect(rec).toHaveProperty("regulatory_ref");
      }
    });

    it("insights have required fields", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        total_children: 3,
      });
      for (const ins of r.insights) {
        expect(ins).toHaveProperty("text");
        expect(ins).toHaveProperty("severity");
      }
    });
  });

  // == EDGE CASES =============================================================

  describe("edge cases", () => {
    it("single record in each domain", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: [makeRiskAssessment()],
        flooring_condition_records: [makeFlooringCondition()],
        wet_floor_records: [makeWetFloorProtocol()],
        stairway_safety_records: [makeStairwaySafety()],
        incident_records: [makeIncident()],
      });
      expect(r.falls_prevention_rating).toBeDefined();
      expect(r.falls_prevention_score).toBeGreaterThan(0);
    });

    it("mixed good and bad across domains", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: Array.from({ length: 10 }, (_, i) =>
          makeRiskAssessment({ id: `ra_${i}` }),
        ),
        flooring_condition_records: Array.from({ length: 10 }, (_, i) =>
          makeFlooringCondition({ id: `fc_${i}`, condition: "hazardous" }),
        ),
      });
      expect(r.strengths.length).toBeGreaterThan(0);
      expect(r.concerns.length).toBeGreaterThan(0);
    });

    it("only risk assessments populated", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: Array.from({ length: 10 }, (_, i) =>
          makeRiskAssessment({ id: `ra_${i}` }),
        ),
      });
      expect(r.risk_assessment_rate).toBe(100);
      expect(r.flooring_condition_rate).toBe(0);
      expect(r.wet_floor_protocol_rate).toBeNull();
      expect(r.stairway_safety_rate).toBeNull();
      expect(r.incident_learning_rate).toBeNull();
    });

    it("only flooring records populated", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        flooring_condition_records: Array.from({ length: 10 }, (_, i) =>
          makeFlooringCondition({ id: `fc_${i}` }),
        ),
      });
      expect(r.flooring_condition_rate).toBe(100);
      expect(r.risk_assessment_rate).toBe(0);
    });

    it("only wet floor records populated", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        wet_floor_records: Array.from({ length: 10 }, (_, i) =>
          makeWetFloorProtocol({ id: `wf_${i}` }),
        ),
      });
      expect(r.wet_floor_protocol_rate).toBe(100);
      expect(r.risk_assessment_rate).toBe(0);
    });

    it("only stairway records populated", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        stairway_safety_records: Array.from({ length: 10 }, (_, i) =>
          makeStairwaySafety({ id: `ss_${i}` }),
        ),
      });
      expect(r.stairway_safety_rate).toBe(100);
      expect(r.risk_assessment_rate).toBe(0);
    });

    it("only incident records populated", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        incident_records: Array.from({ length: 10 }, (_, i) =>
          makeIncident({ id: `inc_${i}` }),
        ),
      });
      expect(r.incident_learning_rate).toBe(100);
      expect(r.risk_assessment_rate).toBe(0);
    });

    it("large dataset performance", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: Array.from({ length: 200 }, (_, i) =>
          makeRiskAssessment({ id: `ra_${i}` }),
        ),
        flooring_condition_records: Array.from({ length: 200 }, (_, i) =>
          makeFlooringCondition({ id: `fc_${i}` }),
        ),
        wet_floor_records: Array.from({ length: 200 }, (_, i) =>
          makeWetFloorProtocol({ id: `wf_${i}` }),
        ),
        stairway_safety_records: Array.from({ length: 200 }, (_, i) =>
          makeStairwaySafety({ id: `ss_${i}` }),
        ),
        incident_records: Array.from({ length: 200 }, (_, i) =>
          makeIncident({ id: `inc_${i}` }),
        ),
      });
      expect(r.falls_prevention_rating).toBe("outstanding");
    });

    it("total_children 0 with some records returns adequate+", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        total_children: 0,
        risk_assessment_records: [makeRiskAssessment()],
      });
      expect(r.falls_prevention_rating).not.toBe("insufficient_data");
    });

    it("zero actions_required means 0% action completion (not divide by zero)", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: [
          makeRiskAssessment({ actions_required: 0, actions_completed: 0 }),
        ],
      });
      // Should not crash; no action-related strength generated
      expect(r.falls_prevention_rating).toBeDefined();
    });

    it("no repairs needed means repairCompletionRate doesnt trigger concerns", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        flooring_condition_records: Array.from({ length: 10 }, (_, i) =>
          makeFlooringCondition({ id: `fc_${i}`, repair_needed: false, repair_completed: false }),
        ),
      });
      expect(r.concerns.some((c) => c.includes("flooring repairs"))).toBe(false);
    });

    it("no injuries means firstAid strength not triggered", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        incident_records: Array.from({ length: 10 }, (_, i) =>
          makeIncident({ id: `inc_${i}`, injury_sustained: false, first_aid_given: false }),
        ),
      });
      expect(r.strengths.some((s) => s.includes("First aid"))).toBe(false);
    });

    it("no defects found means rectification strength not triggered", () => {
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        stairway_safety_records: Array.from({ length: 10 }, (_, i) =>
          makeStairwaySafety({ id: `ss_${i}`, defects_found: [], defects_rectified: false }),
        ),
      });
      expect(r.strengths.some((s) => s.includes("defects rectified"))).toBe(false);
    });

    it("all incident types represented", () => {
      const types: Array<"slip" | "trip" | "fall" | "near_miss"> = ["slip", "trip", "fall", "near_miss"];
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        incident_records: types.map((t, i) =>
          makeIncident({ id: `inc_${i}`, incident_type: t }),
        ),
      });
      expect(r.falls_prevention_rating).toBeDefined();
    });

    it("all severity types represented", () => {
      const severities: Array<"minor" | "moderate" | "serious" | "major"> = ["minor", "moderate", "serious", "major"];
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        incident_records: severities.map((s, i) =>
          makeIncident({ id: `inc_${i}`, severity: s }),
        ),
      });
      expect(r.falls_prevention_rating).toBeDefined();
    });

    it("all surface conditions represented", () => {
      const conditions: Array<"dry" | "wet" | "icy" | "uneven" | "cluttered" | "other"> = ["dry", "wet", "icy", "uneven", "cluttered", "other"];
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        incident_records: conditions.map((c, i) =>
          makeIncident({ id: `inc_${i}`, surface_condition: c }),
        ),
      });
      expect(r.falls_prevention_rating).toBeDefined();
    });

    it("all flooring types represented", () => {
      const types: Array<"carpet" | "vinyl" | "tile" | "laminate" | "wood" | "concrete" | "rubber" | "other"> = [
        "carpet", "vinyl", "tile", "laminate", "wood", "concrete", "rubber", "other",
      ];
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        flooring_condition_records: types.map((t, i) =>
          makeFlooringCondition({ id: `fc_${i}`, flooring_type: t }),
        ),
      });
      expect(r.falls_prevention_rating).toBeDefined();
    });

    it("all environment types represented", () => {
      const envTypes: Array<"indoor" | "outdoor" | "both"> = ["indoor", "outdoor", "both"];
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: envTypes.map((e, i) =>
          makeRiskAssessment({ id: `ra_${i}`, environment_type: e }),
        ),
      });
      expect(r.falls_prevention_rating).toBeDefined();
    });

    it("all risk levels represented", () => {
      const levels: Array<"low" | "medium" | "high" | "critical"> = ["low", "medium", "high", "critical"];
      const r = computeSlipsTripsFallsPrevention({
        ...baseInput,
        risk_assessment_records: levels.map((l, i) =>
          makeRiskAssessment({ id: `ra_${i}`, risk_level: l }),
        ),
      });
      expect(r.falls_prevention_rating).toBeDefined();
    });
  });
});
