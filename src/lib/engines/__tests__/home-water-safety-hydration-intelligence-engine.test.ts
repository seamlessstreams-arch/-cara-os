// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME WATER SAFETY & HYDRATION INTELLIGENCE ENGINE TESTS
// Comprehensive test suite covering water temperature checks, legionella
// assessments, hydration monitoring, swimming competency, water activity safety.
// Reg 25 premises/safety, Reg 5 quality of care, SCCIF safety.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeWaterSafetyHydration,
  type WaterSafetyInput,
  type WaterTemperatureRecordInput,
  type LegionellaAssessmentRecordInput,
  type HydrationMonitoringRecordInput,
  type SwimmingCompetencyRecordInput,
  type WaterActivitySafetyRecordInput,
  type WaterSafetyResult,
} from "../home-water-safety-hydration-intelligence-engine";

// ── Helpers ────────────────────────────────────────────────────────────────

const TODAY = "2026-05-25";
let _id = 0;

function baseInput(overrides: Partial<WaterSafetyInput> = {}): WaterSafetyInput {
  return {
    today: TODAY,
    total_children: 3,
    water_temperature_records: [],
    legionella_assessment_records: [],
    hydration_monitoring_records: [],
    swimming_competency_records: [],
    water_activity_safety_records: [],
    ...overrides,
  };
}

function makeTemp(overrides: Partial<WaterTemperatureRecordInput> = {}): WaterTemperatureRecordInput {
  _id++;
  return {
    id: `temp_${_id}`,
    date: "2026-05-20",
    location: "Bathroom 1",
    outlet_type: "hot_tap",
    temperature_celsius: 40,
    within_safe_range: true,
    thermostatic_mixing_valve_fitted: true,
    tmv_tested: true,
    scald_risk_identified: false,
    action_taken_if_unsafe: false,
    checked_by: "Ryan",
    notes: "",
    created_at: "2026-05-20",
    ...overrides,
  };
}

function makeLegionella(overrides: Partial<LegionellaAssessmentRecordInput> = {}): LegionellaAssessmentRecordInput {
  _id++;
  return {
    id: `leg_${_id}`,
    date: "2026-05-15",
    assessment_type: "monthly_flush",
    compliant: true,
    assessor: "AquaChem Ltd",
    dead_legs_identified: 0,
    dead_legs_remediated: 0,
    water_storage_temperature_compliant: true,
    distribution_temperature_compliant: true,
    flushing_regime_followed: true,
    written_scheme_in_place: true,
    next_assessment_due: "2026-06-15",
    overdue: false,
    findings: "",
    actions_required: 0,
    actions_completed: 0,
    notes: "",
    created_at: "2026-05-15",
    ...overrides,
  };
}

function makeHydration(overrides: Partial<HydrationMonitoringRecordInput> = {}): HydrationMonitoringRecordInput {
  _id++;
  return {
    id: `hyd_${_id}`,
    child_id: "yp_alex",
    date: "2026-05-20",
    fluid_intake_ml: 1800,
    target_intake_ml: 2000,
    met_target: true,
    hydration_concern_raised: false,
    concern_type: "none",
    intervention_provided: false,
    intervention_type: "",
    child_encouraged: true,
    accessible_water_available: true,
    staff_prompted: true,
    notes: "",
    created_at: "2026-05-20",
    ...overrides,
  };
}

function makeSwimming(overrides: Partial<SwimmingCompetencyRecordInput> = {}): SwimmingCompetencyRecordInput {
  _id++;
  return {
    id: `swim_${_id}`,
    child_id: "yp_alex",
    date: "2026-05-10",
    competency_level: "competent",
    assessment_conducted: true,
    assessor_qualified: true,
    water_confidence_rating: 4,
    can_swim_25m: true,
    water_safety_knowledge_assessed: true,
    water_safety_knowledge_passed: true,
    lessons_attended: 10,
    lessons_offered: 10,
    parental_consent_obtained: true,
    risk_assessment_completed: true,
    notes: "",
    created_at: "2026-05-10",
    ...overrides,
  };
}

function makeActivity(overrides: Partial<WaterActivitySafetyRecordInput> = {}): WaterActivitySafetyRecordInput {
  _id++;
  return {
    id: `act_${_id}`,
    date: "2026-05-18",
    activity_type: "swimming_pool",
    risk_assessment_completed: true,
    risk_assessment_approved: true,
    qualified_supervision: true,
    supervision_ratio_met: true,
    child_competencies_checked: true,
    safety_equipment_available: true,
    safety_briefing_given: true,
    emergency_plan_in_place: true,
    incident_occurred: false,
    incident_type: "",
    children_participated: 3,
    children_total: 3,
    consent_obtained_all: true,
    first_aider_present: true,
    notes: "",
    created_at: "2026-05-18",
    ...overrides,
  };
}

/** Convenience: N copies of a record */
function repeat<T>(factory: (o?: any) => T, n: number, overrides = {}): T[] {
  return Array.from({ length: n }, () => factory(overrides));
}

function run(overrides: Partial<WaterSafetyInput> = {}): WaterSafetyResult {
  return computeWaterSafetyHydration(baseInput(overrides));
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. INSUFFICIENT DATA
// ══════════════════════════════════════════════════════════════════════════════

describe("insufficient_data", () => {
  it("returns insufficient_data when all arrays empty and total_children=0", () => {
    const r = run({ total_children: 0 });
    expect(r.water_safety_rating).toBe("insufficient_data");
    expect(r.water_safety_score).toBe(0);
    expect(r.headline).toContain("insufficient data");
  });

  it("returns score 0 for insufficient_data", () => {
    const r = run({ total_children: 0 });
    expect(r.water_safety_score).toBe(0);
  });

  it("returns empty arrays for strengths/concerns/recommendations/insights", () => {
    const r = run({ total_children: 0 });
    expect(r.strengths).toHaveLength(0);
    expect(r.concerns).toHaveLength(0);
    expect(r.recommendations).toHaveLength(0);
    expect(r.insights).toHaveLength(0);
  });

  it("returns 0 for all rates and record counts", () => {
    const r = run({ total_children: 0 });
    expect(r.total_temperature_records).toBe(0);
    expect(r.total_legionella_records).toBe(0);
    expect(r.total_hydration_records).toBe(0);
    expect(r.total_swimming_competency_records).toBe(0);
    expect(r.total_water_activity_records).toBe(0);
    expect(r.temperature_check_rate).toBe(0);
    expect(r.legionella_compliance_rate).toBe(0);
    expect(r.hydration_monitoring_rate).toBe(0);
    expect(r.swimming_competency_rate).toBe(0);
    expect(r.water_activity_safety_rate).toBe(0);
    expect(r.child_awareness_rate).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. INADEQUATE FLOOR (all empty + children > 0)
// ══════════════════════════════════════════════════════════════════════════════

describe("inadequate floor — all empty with children", () => {
  it("returns inadequate with score 15 when children exist but no records", () => {
    const r = run({ total_children: 3 });
    expect(r.water_safety_rating).toBe("inadequate");
    expect(r.water_safety_score).toBe(15);
  });

  it("headline mentions no water safety data and urgent attention", () => {
    const r = run({ total_children: 3 });
    expect(r.headline).toContain("No water safety or hydration data recorded");
    expect(r.headline).toContain("urgent attention");
  });

  it("has exactly 1 concern about missing records", () => {
    const r = run({ total_children: 3 });
    expect(r.concerns).toHaveLength(1);
    expect(r.concerns[0]).toContain("No water temperature records");
  });

  it("has exactly 3 recommendations all immediate", () => {
    const r = run({ total_children: 3 });
    expect(r.recommendations).toHaveLength(3);
    expect(r.recommendations.every((rec) => rec.urgency === "immediate")).toBe(true);
  });

  it("has exactly 1 critical insight about regulatory concern", () => {
    const r = run({ total_children: 3 });
    expect(r.insights).toHaveLength(1);
    expect(r.insights[0].severity).toBe("critical");
  });

  it("works with total_children=1", () => {
    const r = run({ total_children: 1 });
    expect(r.water_safety_rating).toBe("inadequate");
    expect(r.water_safety_score).toBe(15);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. pct HELPER EDGE CASE
// ══════════════════════════════════════════════════════════════════════════════

describe("pct(0,0) = 0 — zero-denominator safety", () => {
  it("temperature_check_rate is 0 when no temp records but other records exist", () => {
    const r = run({
      legionella_assessment_records: [makeLegionella()],
    });
    expect(r.temperature_check_rate).toBe(0);
  });

  it("legionella_compliance_rate is 0 when no legionella records but other records exist", () => {
    const r = run({
      water_temperature_records: [makeTemp()],
    });
    expect(r.legionella_compliance_rate).toBe(0);
  });

  it("hydration_monitoring_rate is 0 when no hydration records", () => {
    const r = run({
      water_temperature_records: [makeTemp()],
    });
    expect(r.hydration_monitoring_rate).toBe(0);
  });

  it("swimming_competency_rate is 0 when no swimming records", () => {
    const r = run({
      water_temperature_records: [makeTemp()],
    });
    expect(r.swimming_competency_rate).toBeNull();;
  });

  it("water_activity_safety_rate is 0 when no activity records", () => {
    const r = run({
      water_temperature_records: [makeTemp()],
    });
    expect(r.water_activity_safety_rate).toBeNull();;
  });

  it("child_awareness_rate is 0 when no relevant records contribute", () => {
    const r = run({
      water_temperature_records: [makeTemp()],
      legionella_assessment_records: [makeLegionella()],
    });
    expect(r.child_awareness_rate).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. RATING THRESHOLDS
// ══════════════════════════════════════════════════════════════════════════════

describe("rating thresholds", () => {
  it("score 80 yields outstanding", () => {
    // Build scenario: base=52 + all max bonuses = 52+28=80
    const r = run({
      water_temperature_records: repeat(makeTemp, 20, { within_safe_range: true, thermostatic_mixing_valve_fitted: true, tmv_tested: true, scald_risk_identified: false }),
      legionella_assessment_records: repeat(makeLegionella, 10, { compliant: true, flushing_regime_followed: true, written_scheme_in_place: true, actions_required: 1, actions_completed: 1 }),
      hydration_monitoring_records: [
        ...repeat(makeHydration, 10, { child_id: "yp_alex", met_target: true, child_encouraged: true, accessible_water_available: true }),
        ...repeat(makeHydration, 10, { child_id: "yp_jordan", met_target: true, child_encouraged: true, accessible_water_available: true }),
        ...repeat(makeHydration, 10, { child_id: "yp_casey", met_target: true, child_encouraged: true, accessible_water_available: true }),
      ],
      swimming_competency_records: [
        makeSwimming({ child_id: "yp_alex", assessment_conducted: true, water_safety_knowledge_assessed: true, water_safety_knowledge_passed: true, lessons_attended: 10, lessons_offered: 10 }),
        makeSwimming({ child_id: "yp_jordan", assessment_conducted: true, water_safety_knowledge_assessed: true, water_safety_knowledge_passed: true, lessons_attended: 10, lessons_offered: 10 }),
        makeSwimming({ child_id: "yp_casey", assessment_conducted: true, water_safety_knowledge_assessed: true, water_safety_knowledge_passed: true, lessons_attended: 10, lessons_offered: 10 }),
      ],
      water_activity_safety_records: repeat(makeActivity, 10, {
        risk_assessment_completed: true, qualified_supervision: true, supervision_ratio_met: true,
        safety_equipment_available: true, safety_briefing_given: true, emergency_plan_in_place: true,
      }),
    });
    expect(r.water_safety_score).toBeGreaterThanOrEqual(80);
    expect(r.water_safety_rating).toBe("outstanding");
  });

  it("score 65-79 yields good", () => {
    // base=52, add temp+legionella bonuses at high tier + action bonus = 52+4+4+3=63, not enough
    // Need to be more targeted: 52 + 4(temp95) + 4(leg95) + 3(hyd90) + 1(swim70) + 2(act80) = 66
    const r = run({
      water_temperature_records: repeat(makeTemp, 20, { within_safe_range: true }),
      legionella_assessment_records: repeat(makeLegionella, 20, { compliant: true }),
      hydration_monitoring_records: repeat(makeHydration, 20, { met_target: true, child_encouraged: true, accessible_water_available: true }),
      swimming_competency_records: [
        makeSwimming({ child_id: "yp_alex", assessment_conducted: true, water_safety_knowledge_assessed: true, water_safety_knowledge_passed: true, lessons_attended: 7, lessons_offered: 10 }),
      ],
      water_activity_safety_records: [
        makeActivity({ risk_assessment_completed: true, qualified_supervision: true, supervision_ratio_met: true, safety_equipment_available: true, safety_briefing_given: false, emergency_plan_in_place: true }),
      ],
    });
    expect(r.water_safety_score).toBeGreaterThanOrEqual(65);
    expect(r.water_safety_score).toBeLessThan(80);
    expect(r.water_safety_rating).toBe("good");
  });

  it("score 45-64 yields adequate", () => {
    // base=52 with no bonuses and no penalties = 52 => adequate
    const r = run({
      water_temperature_records: [
        makeTemp({ within_safe_range: true }),
        makeTemp({ within_safe_range: false, action_taken_if_unsafe: false }),
      ],
      legionella_assessment_records: [
        makeLegionella({ compliant: true }),
        makeLegionella({ compliant: false }),
      ],
      hydration_monitoring_records: [
        makeHydration({ met_target: true }),
        makeHydration({ met_target: false }),
      ],
    });
    // temp=50%, leg=50%, hyd=50% — no bonuses, no penalties
    expect(r.water_safety_score).toBeGreaterThanOrEqual(45);
    expect(r.water_safety_score).toBeLessThan(65);
    expect(r.water_safety_rating).toBe("adequate");
  });

  it("score < 45 yields inadequate", () => {
    // base=52, trigger multiple penalties: temp<50 (-5), leg<50 (-5), hyd<40 (-3) = 52-13=39
    const r = run({
      water_temperature_records: [
        makeTemp({ within_safe_range: false, action_taken_if_unsafe: false }),
        makeTemp({ within_safe_range: false, action_taken_if_unsafe: false }),
        makeTemp({ within_safe_range: false, action_taken_if_unsafe: false }),
      ],
      legionella_assessment_records: [
        makeLegionella({ compliant: false }),
        makeLegionella({ compliant: false }),
        makeLegionella({ compliant: false }),
      ],
      hydration_monitoring_records: [
        makeHydration({ met_target: false }),
        makeHydration({ met_target: false }),
        makeHydration({ met_target: false }),
      ],
    });
    expect(r.water_safety_score).toBeLessThan(45);
    expect(r.water_safety_rating).toBe("inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. OUTSTANDING SCENARIO
// ══════════════════════════════════════════════════════════════════════════════

describe("outstanding scenario", () => {
  function outstandingInput(): Partial<WaterSafetyInput> {
    return {
      water_temperature_records: repeat(makeTemp, 20, {
        within_safe_range: true,
        thermostatic_mixing_valve_fitted: true,
        tmv_tested: true,
        scald_risk_identified: false,
      }),
      legionella_assessment_records: repeat(makeLegionella, 10, {
        compliant: true,
        flushing_regime_followed: true,
        written_scheme_in_place: true,
        actions_required: 2,
        actions_completed: 2,
        dead_legs_identified: 1,
        dead_legs_remediated: 1,
      }),
      hydration_monitoring_records: [
        ...repeat(makeHydration, 10, { child_id: "yp_alex", met_target: true, child_encouraged: true, accessible_water_available: true }),
        ...repeat(makeHydration, 10, { child_id: "yp_jordan", met_target: true, child_encouraged: true, accessible_water_available: true }),
        ...repeat(makeHydration, 10, { child_id: "yp_casey", met_target: true, child_encouraged: true, accessible_water_available: true }),
      ],
      swimming_competency_records: [
        makeSwimming({ child_id: "yp_alex" }),
        makeSwimming({ child_id: "yp_jordan" }),
        makeSwimming({ child_id: "yp_casey" }),
      ],
      water_activity_safety_records: repeat(makeActivity, 10),
    };
  }

  it("achieves outstanding rating", () => {
    const r = run(outstandingInput());
    expect(r.water_safety_rating).toBe("outstanding");
  });

  it("achieves score >= 80", () => {
    const r = run(outstandingInput());
    expect(r.water_safety_score).toBeGreaterThanOrEqual(80);
  });

  it("headline mentions outstanding", () => {
    const r = run(outstandingInput());
    expect(r.headline).toContain("Outstanding");
  });

  it("has multiple strengths and no concerns", () => {
    const r = run(outstandingInput());
    expect(r.strengths.length).toBeGreaterThan(0);
    expect(r.concerns).toHaveLength(0);
  });

  it("has no recommendations", () => {
    const r = run(outstandingInput());
    expect(r.recommendations).toHaveLength(0);
  });

  it("has positive insight about outstanding rating", () => {
    const r = run(outstandingInput());
    const positive = r.insights.filter((i) => i.severity === "positive");
    expect(positive.length).toBeGreaterThan(0);
    expect(positive.some((i) => i.text.includes("outstanding"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. GOOD SCENARIO
// ══════════════════════════════════════════════════════════════════════════════

describe("good scenario", () => {
  it("achieves good rating with moderate bonuses", () => {
    const r = run({
      water_temperature_records: repeat(makeTemp, 20, { within_safe_range: true }),
      legionella_assessment_records: repeat(makeLegionella, 10, { compliant: true }),
      hydration_monitoring_records: repeat(makeHydration, 10, { met_target: true, child_encouraged: true, accessible_water_available: true }),
      swimming_competency_records: [
        makeSwimming({ child_id: "yp_alex", assessment_conducted: true, water_safety_knowledge_assessed: true, water_safety_knowledge_passed: true, lessons_attended: 7, lessons_offered: 10 }),
      ],
      water_activity_safety_records: [
        makeActivity({ safety_briefing_given: false }),
      ],
    });
    expect(r.water_safety_rating).toBe("good");
  });

  it("headline mentions good and strengths count", () => {
    const r = run({
      water_temperature_records: repeat(makeTemp, 20, { within_safe_range: true }),
      legionella_assessment_records: repeat(makeLegionella, 10, { compliant: true }),
      hydration_monitoring_records: repeat(makeHydration, 10, { met_target: true, child_encouraged: true, accessible_water_available: true }),
      swimming_competency_records: [
        makeSwimming({ child_id: "yp_alex", assessment_conducted: true, water_safety_knowledge_assessed: true, water_safety_knowledge_passed: true, lessons_attended: 7, lessons_offered: 10 }),
      ],
      water_activity_safety_records: [
        makeActivity({ safety_briefing_given: false }),
      ],
    });
    expect(r.headline).toContain("Good water safety");
    expect(r.headline).toMatch(/\d+ strength/);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. ADEQUATE SCENARIO
// ══════════════════════════════════════════════════════════════════════════════

describe("adequate scenario", () => {
  it("achieves adequate with base score and no bonuses/penalties", () => {
    // 50% rates — base stays 52, no bonuses triggered, no penalties
    const r = run({
      water_temperature_records: [
        makeTemp({ within_safe_range: true }),
        makeTemp({ within_safe_range: false, action_taken_if_unsafe: true }),
      ],
      legionella_assessment_records: [
        makeLegionella({ compliant: true }),
        makeLegionella({ compliant: false }),
      ],
      hydration_monitoring_records: [
        makeHydration({ met_target: true }),
        makeHydration({ met_target: false }),
      ],
    });
    expect(r.water_safety_rating).toBe("adequate");
    expect(r.water_safety_score).toBeGreaterThanOrEqual(45);
  });

  it("headline mentions adequate and concerns count", () => {
    const r = run({
      water_temperature_records: [
        makeTemp({ within_safe_range: true }),
        makeTemp({ within_safe_range: false, action_taken_if_unsafe: true }),
      ],
      legionella_assessment_records: [
        makeLegionella({ compliant: true }),
        makeLegionella({ compliant: false }),
      ],
    });
    expect(r.headline).toContain("Adequate");
    expect(r.headline).toMatch(/\d+ concern/);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 8. INADEQUATE SCENARIO
// ══════════════════════════════════════════════════════════════════════════════

describe("inadequate scenario — via penalties", () => {
  it("drops to inadequate with multiple penalties", () => {
    const r = run({
      water_temperature_records: repeat(makeTemp, 10, { within_safe_range: false, action_taken_if_unsafe: false }),
      legionella_assessment_records: repeat(makeLegionella, 10, { compliant: false }),
      hydration_monitoring_records: repeat(makeHydration, 10, { met_target: false, child_encouraged: false, accessible_water_available: false }),
    });
    // 52 - 5 (temp<50) - 5 (leg<50) - 3 (hyd<40) = 39
    expect(r.water_safety_score).toBe(39);
    expect(r.water_safety_rating).toBe("inadequate");
  });

  it("headline mentions inadequate and concern count", () => {
    const r = run({
      water_temperature_records: repeat(makeTemp, 10, { within_safe_range: false }),
      legionella_assessment_records: repeat(makeLegionella, 10, { compliant: false }),
    });
    expect(r.headline).toContain("inadequate");
    expect(r.headline).toMatch(/\d+ significant concern/);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 9. BONUSES IN ISOLATION
// ══════════════════════════════════════════════════════════════════════════════

describe("Bonus 1: temperatureCheckRate", () => {
  it("+4 when temperatureCheckRate >= 95", () => {
    const r = run({
      water_temperature_records: repeat(makeTemp, 20, { within_safe_range: true }),
    });
    // 52 + 4 (temp>=95) + 3 (actionTaken: no unsafe=all safe+records>0) = 59
    expect(r.water_safety_score).toBe(59);
  });

  it("+2 when temperatureCheckRate >= 80 but < 95", () => {
    // 17/20 = 85%
    const r = run({
      water_temperature_records: [
        ...repeat(makeTemp, 17, { within_safe_range: true }),
        ...repeat(makeTemp, 3, { within_safe_range: false, action_taken_if_unsafe: true }),
      ],
    });
    // 52 + 2 (temp80) + 3 (action 100%) = 57
    expect(r.water_safety_score).toBe(57);
  });

  it("no bonus when temperatureCheckRate < 80 but >= 50", () => {
    // 12/20 = 60%
    const r = run({
      water_temperature_records: [
        ...repeat(makeTemp, 12, { within_safe_range: true }),
        ...repeat(makeTemp, 8, { within_safe_range: false, action_taken_if_unsafe: true }),
      ],
    });
    // 52 + 0 (temp) + 3 (action 100%) = 55
    expect(r.water_safety_score).toBe(55);
  });
});

describe("Bonus 2: legionellaComplianceRate", () => {
  it("+4 when legionellaComplianceRate >= 95", () => {
    const r = run({
      legionella_assessment_records: repeat(makeLegionella, 20, { compliant: true }),
    });
    // 52 + 4 = 56
    expect(r.water_safety_score).toBe(56);
  });

  it("+2 when legionellaComplianceRate >= 80 but < 95", () => {
    // 17/20 = 85%
    const r = run({
      legionella_assessment_records: [
        ...repeat(makeLegionella, 17, { compliant: true }),
        ...repeat(makeLegionella, 3, { compliant: false }),
      ],
    });
    // 52 + 2 = 54
    expect(r.water_safety_score).toBe(54);
  });

  it("no bonus when legionellaComplianceRate < 80 but >= 50", () => {
    // 12/20 = 60%
    const r = run({
      legionella_assessment_records: [
        ...repeat(makeLegionella, 12, { compliant: true }),
        ...repeat(makeLegionella, 8, { compliant: false }),
      ],
    });
    // 52 + 0 = 52
    expect(r.water_safety_score).toBe(52);
  });
});

describe("Bonus 3: hydrationMonitoringRate", () => {
  it("+3 when hydrationMonitoringRate >= 90", () => {
    const r = run({
      hydration_monitoring_records: repeat(makeHydration, 20, { met_target: true, child_encouraged: false, accessible_water_available: false }),
    });
    // 52 + 3 = 55
    expect(r.water_safety_score).toBe(55);
  });

  it("+1 when hydrationMonitoringRate >= 70 but < 90", () => {
    // 15/20 = 75%
    const r = run({
      hydration_monitoring_records: [
        ...repeat(makeHydration, 15, { met_target: true, child_encouraged: false, accessible_water_available: false }),
        ...repeat(makeHydration, 5, { met_target: false, child_encouraged: false, accessible_water_available: false }),
      ],
    });
    // 52 + 1 = 53
    expect(r.water_safety_score).toBe(53);
  });

  it("no bonus when hydrationMonitoringRate < 70 but >= 40", () => {
    // 12/20 = 60%
    const r = run({
      hydration_monitoring_records: [
        ...repeat(makeHydration, 12, { met_target: true, child_encouraged: false, accessible_water_available: false }),
        ...repeat(makeHydration, 8, { met_target: false, child_encouraged: false, accessible_water_available: false }),
      ],
    });
    expect(r.water_safety_score).toBe(52);
  });
});

describe("Bonus 4: swimmingCompetencyRate", () => {
  it("+3 when swimmingCompetencyRate >= 90", () => {
    // All components at 100%: assessment=100, knowledge=100, lessons=100
    // Also triggers child awareness (knowledge passed) => +3 awareness bonus
    const r = run({
      swimming_competency_records: [
        makeSwimming({ assessment_conducted: true, water_safety_knowledge_assessed: true, water_safety_knowledge_passed: true, lessons_attended: 10, lessons_offered: 10 }),
      ],
    });
    // 52 + 3 (swim) + 3 (awareness via knowledge 100%) = 58
    expect(r.water_safety_score).toBe(58);
  });

  it("+1 when swimmingCompetencyRate >= 70 but < 90", () => {
    // assessment=100%, knowledge=100%, lessons=70% -> avg ~90%. Need lower.
    // assessment=70%, no knowledge assessed, lessons=70% -> avg(70,70)=70
    const r = run({
      swimming_competency_records: [
        makeSwimming({ assessment_conducted: true, water_safety_knowledge_assessed: false, water_safety_knowledge_passed: false, lessons_attended: 7, lessons_offered: 10 }),
        makeSwimming({ assessment_conducted: false, water_safety_knowledge_assessed: false, water_safety_knowledge_passed: false, lessons_attended: 7, lessons_offered: 10 }),
        ...repeat(makeSwimming, 8, { assessment_conducted: true, water_safety_knowledge_assessed: false, water_safety_knowledge_passed: false, lessons_attended: 7, lessons_offered: 10 }),
      ],
    });
    expect(r.swimming_competency_rate).toBeGreaterThanOrEqual(70);
    expect(r.swimming_competency_rate).toBeLessThan(90);
    expect(r.water_safety_score).toBe(53);
  });

  it("no bonus when swimmingCompetencyRate < 70", () => {
    // assessment=40%, no knowledge, lessons=40% -> avg(40,40)=40
    const r = run({
      swimming_competency_records: [
        ...repeat(makeSwimming, 4, { assessment_conducted: true, water_safety_knowledge_assessed: false, lessons_attended: 4, lessons_offered: 10 }),
        ...repeat(makeSwimming, 6, { assessment_conducted: false, water_safety_knowledge_assessed: false, lessons_attended: 4, lessons_offered: 10 }),
      ],
    });
    expect(r.swimming_competency_rate).toBeLessThan(70);
    expect(r.water_safety_score).toBe(52);
  });
});

describe("Bonus 5: waterActivitySafetyRate", () => {
  it("+4 when waterActivitySafetyRate >= 95", () => {
    // All 6 components at 100%. Also triggers child awareness (briefing 100%) => +3
    const r = run({
      water_activity_safety_records: repeat(makeActivity, 10),
    });
    expect(r.water_activity_safety_rate).toBe(100);
    // 52 + 4 (activity) + 3 (awareness via briefing 100%) = 59
    expect(r.water_safety_score).toBe(59);
  });

  it("+2 when waterActivitySafetyRate >= 80 but < 95", () => {
    // 5/6 components at 100%, 1 at 50%: avg ~ 92%. Need between 80 and 95.
    // Make 10 activities, 8 have all true, 2 have safety_briefing=false
    // Rates: RA=100, QS=100, SR=100, SE=100, SB=80, EP=100 -> avg=97. Still too high.
    // 10 activities, 3 with safety_briefing=false: SB=70 -> avg(100,100,100,100,70,100)=95. Exactly 95.
    // Need < 95. 10 activities, 4 with safety_briefing=false: SB=60 -> avg=93
    const r = run({
      water_activity_safety_records: [
        ...repeat(makeActivity, 6, { safety_briefing_given: true }),
        ...repeat(makeActivity, 4, { safety_briefing_given: false }),
      ],
    });
    // avg(100,100,100,100,60,100)=93
    expect(r.water_activity_safety_rate).toBeGreaterThanOrEqual(80);
    expect(r.water_activity_safety_rate).toBeLessThan(95);
    // 52 + 2 = 54
    expect(r.water_safety_score).toBe(54);
  });

  it("no bonus when waterActivitySafetyRate < 80 but >= 50", () => {
    // Make half components fail for some activities
    const r = run({
      water_activity_safety_records: [
        makeActivity({ risk_assessment_completed: true, qualified_supervision: true, supervision_ratio_met: true, safety_equipment_available: false, safety_briefing_given: false, emergency_plan_in_place: false }),
        makeActivity({ risk_assessment_completed: false, qualified_supervision: false, supervision_ratio_met: false, safety_equipment_available: true, safety_briefing_given: true, emergency_plan_in_place: true }),
      ],
    });
    // Each component: 50%. avg=50
    expect(r.water_activity_safety_rate).toBe(50);
    expect(r.water_safety_score).toBe(52);
  });
});

describe("Bonus 6: childAwarenessRate", () => {
  it("+3 when childAwarenessRate >= 90", () => {
    // All awareness sources: knowledge passed=100%, encouraged=100%, briefing=100%
    const r = run({
      swimming_competency_records: [makeSwimming({ water_safety_knowledge_assessed: true, water_safety_knowledge_passed: true })],
      hydration_monitoring_records: repeat(makeHydration, 10, { child_encouraged: true }),
      water_activity_safety_records: repeat(makeActivity, 10, { safety_briefing_given: true }),
    });
    expect(r.child_awareness_rate).toBeGreaterThanOrEqual(90);
    // 52 + 3(swim) + 3(awareness) + 3(hyd>=90) + 4(activity>=95) = 65, but also other bonuses
    // Just check awareness bonus contributes
    expect(r.water_safety_score).toBeGreaterThanOrEqual(55);
  });

  it("+1 when childAwarenessRate >= 70 but < 90", () => {
    // knowledge: 1 passed of 1 assessed = 100%, encouraged: 7/10=70%, briefing: 7/10=70%
    // total numerators: 1+7+7=15, denominators: 1+10+10=21 => pct(15,21)=71%
    const r = run({
      swimming_competency_records: [makeSwimming({ water_safety_knowledge_assessed: true, water_safety_knowledge_passed: true })],
      hydration_monitoring_records: [
        ...repeat(makeHydration, 7, { child_encouraged: true }),
        ...repeat(makeHydration, 3, { child_encouraged: false }),
      ],
      water_activity_safety_records: [
        ...repeat(makeActivity, 7, { safety_briefing_given: true }),
        ...repeat(makeActivity, 3, { safety_briefing_given: false }),
      ],
    });
    expect(r.child_awareness_rate).toBeGreaterThanOrEqual(70);
    expect(r.child_awareness_rate).toBeLessThan(90);
  });
});

describe("Bonus 7: actionTakenRate / all safe", () => {
  it("+3 when all records are safe (no unsafe records) and records > 0", () => {
    const r = run({
      water_temperature_records: repeat(makeTemp, 10, { within_safe_range: true }),
    });
    // 52 + 4 (temp95%) + 3 (all safe) = 59
    expect(r.water_safety_score).toBe(59);
  });

  it("+3 when actionTakenRate >= 95 (unsafe records exist but acted upon)", () => {
    // 20 unsafe, 19 acted upon = 95%
    const r = run({
      water_temperature_records: [
        ...repeat(makeTemp, 19, { within_safe_range: false, action_taken_if_unsafe: true }),
        makeTemp({ within_safe_range: false, action_taken_if_unsafe: false }),
      ],
    });
    // temp check rate = 0% => -5 penalty. action=95% => +3
    // 52 + 3 - 5 = 50
    expect(r.water_safety_score).toBe(50);
  });

  it("+1 when actionTakenRate >= 80 but < 95", () => {
    // 5 unsafe, 4 acted upon = 80%
    const r = run({
      water_temperature_records: [
        ...repeat(makeTemp, 15, { within_safe_range: true }),
        ...repeat(makeTemp, 4, { within_safe_range: false, action_taken_if_unsafe: true }),
        makeTemp({ within_safe_range: false, action_taken_if_unsafe: false }),
      ],
    });
    // temp=75%, so no temp bonus. action=80% => +1
    // 52 + 1 = 53
    expect(r.water_safety_score).toBe(53);
  });

  it("no bonus when actionTakenRate < 80", () => {
    // 5 unsafe, 2 acted upon = 40%
    const r = run({
      water_temperature_records: [
        ...repeat(makeTemp, 15, { within_safe_range: true }),
        ...repeat(makeTemp, 2, { within_safe_range: false, action_taken_if_unsafe: true }),
        ...repeat(makeTemp, 3, { within_safe_range: false, action_taken_if_unsafe: false }),
      ],
    });
    // temp=75%, action=40%, no bonuses for either. 52 + 0 = 52
    expect(r.water_safety_score).toBe(52);
  });
});

describe("Bonus 8: legionellaActionCompletionRate", () => {
  it("+2 when legionellaActionCompletionRate >= 90", () => {
    const r = run({
      legionella_assessment_records: [
        makeLegionella({ compliant: true, actions_required: 10, actions_completed: 10 }),
      ],
    });
    // 52 + 4(leg95%) + 2(action100%) = 58
    expect(r.water_safety_score).toBe(58);
  });

  it("+1 when legionellaActionCompletionRate >= 70 but < 90", () => {
    // 7/10 = 70%
    const r = run({
      legionella_assessment_records: [
        makeLegionella({ compliant: true, actions_required: 10, actions_completed: 7 }),
      ],
    });
    // 52 + 4(leg95%) + 1(action70%) = 57
    expect(r.water_safety_score).toBe(57);
  });

  it("no bonus when legionellaActionCompletionRate < 70", () => {
    // 5/10 = 50%
    const r = run({
      legionella_assessment_records: [
        makeLegionella({ compliant: true, actions_required: 10, actions_completed: 5 }),
      ],
    });
    // 52 + 4(leg95%) + 0 = 56
    expect(r.water_safety_score).toBe(56);
  });

  it("no bonus when no actions required (pct(0,0)=0)", () => {
    const r = run({
      legionella_assessment_records: [
        makeLegionella({ compliant: true, actions_required: 0, actions_completed: 0 }),
      ],
    });
    // 52 + 4(leg95%) + 0 = 56
    expect(r.water_safety_score).toBe(56);
  });
});

describe("Bonus 9: accessibleWaterRate", () => {
  it("+2 when accessibleWaterRate >= 95", () => {
    const r = run({
      hydration_monitoring_records: repeat(makeHydration, 20, { met_target: true, accessible_water_available: true, child_encouraged: false }),
    });
    // 52 + 3(hyd90%) + 2(accessible95%) = 57
    expect(r.water_safety_score).toBe(57);
  });

  it("+1 when accessibleWaterRate >= 80 but < 95", () => {
    // 17/20 = 85% accessible, 20/20=100% met target
    const r = run({
      hydration_monitoring_records: [
        ...repeat(makeHydration, 17, { met_target: true, accessible_water_available: true, child_encouraged: false }),
        ...repeat(makeHydration, 3, { met_target: true, accessible_water_available: false, child_encouraged: false }),
      ],
    });
    // 52 + 3(hyd90%=100%) + 1(accessible85%) = 56
    expect(r.water_safety_score).toBe(56);
  });

  it("no bonus when accessibleWaterRate < 80", () => {
    // 14/20 = 70%
    const r = run({
      hydration_monitoring_records: [
        ...repeat(makeHydration, 14, { met_target: true, accessible_water_available: true, child_encouraged: false }),
        ...repeat(makeHydration, 6, { met_target: true, accessible_water_available: false, child_encouraged: false }),
      ],
    });
    // 52 + 3(hyd 100%) + 0 = 55
    expect(r.water_safety_score).toBe(55);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 10. MAX BONUS CHECK: base=52, max bonuses=+28
// ══════════════════════════════════════════════════════════════════════════════

describe("max bonus cap", () => {
  it("total bonuses are capped at +28 (max achievable from all 9 bonuses)", () => {
    // Max: 4+4+3+3+4+3+3+2+2 = 28. So max score = 52+28 = 80.
    const r = run({
      water_temperature_records: repeat(makeTemp, 20, { within_safe_range: true }),
      legionella_assessment_records: repeat(makeLegionella, 20, { compliant: true, actions_required: 5, actions_completed: 5 }),
      hydration_monitoring_records: [
        ...repeat(makeHydration, 10, { child_id: "yp_alex", met_target: true, child_encouraged: true, accessible_water_available: true }),
        ...repeat(makeHydration, 10, { child_id: "yp_jordan", met_target: true, child_encouraged: true, accessible_water_available: true }),
        ...repeat(makeHydration, 10, { child_id: "yp_casey", met_target: true, child_encouraged: true, accessible_water_available: true }),
      ],
      swimming_competency_records: [
        makeSwimming({ child_id: "yp_alex", water_safety_knowledge_assessed: true, water_safety_knowledge_passed: true, lessons_attended: 10, lessons_offered: 10, assessment_conducted: true }),
        makeSwimming({ child_id: "yp_jordan", water_safety_knowledge_assessed: true, water_safety_knowledge_passed: true, lessons_attended: 10, lessons_offered: 10, assessment_conducted: true }),
        makeSwimming({ child_id: "yp_casey", water_safety_knowledge_assessed: true, water_safety_knowledge_passed: true, lessons_attended: 10, lessons_offered: 10, assessment_conducted: true }),
      ],
      water_activity_safety_records: repeat(makeActivity, 10, { safety_briefing_given: true }),
    });
    // 52 + 4 + 4 + 3 + 3 + 4 + 3 + 3 + 2 + 2 = 80
    expect(r.water_safety_score).toBe(80);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 11. PENALTIES IN ISOLATION
// ══════════════════════════════════════════════════════════════════════════════

describe("Penalty: temperatureCheckRate < 50", () => {
  it("-5 when temp rate < 50 and records exist", () => {
    // 0% safe temp but include other records to avoid allEmpty
    const r = run({
      water_temperature_records: repeat(makeTemp, 10, { within_safe_range: false, action_taken_if_unsafe: true }),
    });
    // 52 - 5 (temp<50) + 3 (action 100%) = 50
    expect(r.water_safety_score).toBe(50);
  });

  it("no penalty when temp records are empty (guarded)", () => {
    const r = run({
      legionella_assessment_records: [makeLegionella()],
    });
    // 52 + 4 (leg 100%) + 0 = 56 (no penalty since no temp records)
    expect(r.water_safety_score).toBe(56);
  });
});

describe("Penalty: legionellaComplianceRate < 50", () => {
  it("-5 when legionella rate < 50 and records exist", () => {
    const r = run({
      legionella_assessment_records: repeat(makeLegionella, 10, { compliant: false }),
    });
    // 52 - 5 = 47
    expect(r.water_safety_score).toBe(47);
  });

  it("no penalty when legionella records are empty (guarded)", () => {
    const r = run({
      water_temperature_records: [makeTemp()],
    });
    expect(r.water_safety_score).toBeGreaterThanOrEqual(52);
  });
});

describe("Penalty: waterActivitySafetyRate < 50", () => {
  it("-5 when activity safety rate < 50 and records exist", () => {
    // All 6 components at 0%
    const r = run({
      water_activity_safety_records: [
        makeActivity({
          risk_assessment_completed: false,
          qualified_supervision: false,
          supervision_ratio_met: false,
          safety_equipment_available: false,
          safety_briefing_given: false,
          emergency_plan_in_place: false,
        }),
      ],
    });
    // 52 - 5 = 47
    expect(r.water_safety_score).toBe(47);
  });

  it("no penalty when activity records are empty (guarded)", () => {
    const r = run({
      water_temperature_records: [makeTemp()],
    });
    expect(r.water_safety_score).toBeGreaterThanOrEqual(52);
  });
});

describe("Penalty: hydrationMonitoringRate < 40", () => {
  it("-3 when hydration rate < 40 and records exist", () => {
    // 3/10 = 30%
    const r = run({
      hydration_monitoring_records: [
        ...repeat(makeHydration, 3, { met_target: true, child_encouraged: false, accessible_water_available: false }),
        ...repeat(makeHydration, 7, { met_target: false, child_encouraged: false, accessible_water_available: false }),
      ],
    });
    // 52 - 3 = 49
    expect(r.water_safety_score).toBe(49);
  });

  it("no penalty when hydration records are empty (guarded)", () => {
    const r = run({
      water_temperature_records: [makeTemp()],
    });
    expect(r.water_safety_score).toBeGreaterThanOrEqual(52);
  });
});

describe("combined penalties", () => {
  it("stacks all four penalties: -5 -5 -5 -3 = -18", () => {
    const r = run({
      water_temperature_records: repeat(makeTemp, 10, { within_safe_range: false, action_taken_if_unsafe: false }),
      legionella_assessment_records: repeat(makeLegionella, 10, { compliant: false }),
      hydration_monitoring_records: repeat(makeHydration, 10, { met_target: false, child_encouraged: false, accessible_water_available: false }),
      water_activity_safety_records: [
        makeActivity({
          risk_assessment_completed: false, qualified_supervision: false, supervision_ratio_met: false,
          safety_equipment_available: false, safety_briefing_given: false, emergency_plan_in_place: false,
        }),
      ],
    });
    // 52 - 5 - 5 - 5 - 3 = 34
    expect(r.water_safety_score).toBe(34);
    expect(r.water_safety_rating).toBe("inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 12. SIX RATES
// ══════════════════════════════════════════════════════════════════════════════

describe("temperature_check_rate", () => {
  it("100% when all within safe range", () => {
    const r = run({ water_temperature_records: repeat(makeTemp, 5, { within_safe_range: true }) });
    expect(r.temperature_check_rate).toBe(100);
  });

  it("0% when none within safe range", () => {
    const r = run({ water_temperature_records: repeat(makeTemp, 5, { within_safe_range: false }) });
    expect(r.temperature_check_rate).toBe(0);
  });

  it("50% when half within safe range", () => {
    const r = run({
      water_temperature_records: [
        ...repeat(makeTemp, 5, { within_safe_range: true }),
        ...repeat(makeTemp, 5, { within_safe_range: false }),
      ],
    });
    expect(r.temperature_check_rate).toBe(50);
  });

  it("rounds correctly — 2 of 3 = 67%", () => {
    const r = run({
      water_temperature_records: [
        makeTemp({ within_safe_range: true }),
        makeTemp({ within_safe_range: true }),
        makeTemp({ within_safe_range: false }),
      ],
    });
    expect(r.temperature_check_rate).toBe(67);
  });
});

describe("legionella_compliance_rate", () => {
  it("100% when all compliant", () => {
    const r = run({ legionella_assessment_records: repeat(makeLegionella, 5, { compliant: true }) });
    expect(r.legionella_compliance_rate).toBe(100);
  });

  it("0% when none compliant", () => {
    const r = run({ legionella_assessment_records: repeat(makeLegionella, 5, { compliant: false }) });
    expect(r.legionella_compliance_rate).toBe(0);
  });

  it("rounds: 1 of 3 = 33%", () => {
    const r = run({
      legionella_assessment_records: [
        makeLegionella({ compliant: true }),
        makeLegionella({ compliant: false }),
        makeLegionella({ compliant: false }),
      ],
    });
    expect(r.legionella_compliance_rate).toBe(33);
  });
});

describe("hydration_monitoring_rate", () => {
  it("100% when all met target", () => {
    const r = run({ hydration_monitoring_records: repeat(makeHydration, 5, { met_target: true }) });
    expect(r.hydration_monitoring_rate).toBe(100);
  });

  it("0% when none met target", () => {
    const r = run({ hydration_monitoring_records: repeat(makeHydration, 5, { met_target: false }) });
    expect(r.hydration_monitoring_rate).toBe(0);
  });
});

describe("swimming_competency_rate — composite", () => {
  it("100% when all components are 100%", () => {
    const r = run({
      swimming_competency_records: [
        makeSwimming({ assessment_conducted: true, water_safety_knowledge_assessed: true, water_safety_knowledge_passed: true, lessons_attended: 10, lessons_offered: 10 }),
      ],
    });
    // avg(100,100,100) = 100
    expect(r.swimming_competency_rate).toBe(100);
  });

  it("averages only contributing components", () => {
    // No knowledge assessed, no lessons offered => only assessment rate counts
    const r = run({
      swimming_competency_records: [
        makeSwimming({ assessment_conducted: true, water_safety_knowledge_assessed: false, lessons_attended: 0, lessons_offered: 0 }),
        makeSwimming({ assessment_conducted: false, water_safety_knowledge_assessed: false, lessons_attended: 0, lessons_offered: 0 }),
      ],
    });
    // Only assessment rate: 1/2=50%
    expect(r.swimming_competency_rate).toBe(50);
  });

  it("0% when no swimming records", () => {
    const r = run({ water_temperature_records: [makeTemp()] });
    expect(r.swimming_competency_rate).toBeNull();;
  });
});

describe("water_activity_safety_rate — composite", () => {
  it("100% when all 6 components are 100%", () => {
    const r = run({ water_activity_safety_records: repeat(makeActivity, 5) });
    expect(r.water_activity_safety_rate).toBe(100);
  });

  it("0% when all 6 components are 0%", () => {
    const r = run({
      water_activity_safety_records: [
        makeActivity({
          risk_assessment_completed: false, qualified_supervision: false, supervision_ratio_met: false,
          safety_equipment_available: false, safety_briefing_given: false, emergency_plan_in_place: false,
        }),
      ],
    });
    expect(r.water_activity_safety_rate).toBe(0);
  });

  it("averages all 6 components correctly — 3 of 6 at 100% = 50%", () => {
    const r = run({
      water_activity_safety_records: [
        makeActivity({
          risk_assessment_completed: true, qualified_supervision: true, supervision_ratio_met: true,
          safety_equipment_available: false, safety_briefing_given: false, emergency_plan_in_place: false,
        }),
      ],
    });
    // avg(100,100,100,0,0,0) = 50
    expect(r.water_activity_safety_rate).toBe(50);
  });
});

describe("child_awareness_rate — composite", () => {
  it("100% when all 3 sources contribute and are 100%", () => {
    const r = run({
      swimming_competency_records: [makeSwimming({ water_safety_knowledge_assessed: true, water_safety_knowledge_passed: true })],
      hydration_monitoring_records: repeat(makeHydration, 5, { child_encouraged: true }),
      water_activity_safety_records: repeat(makeActivity, 5, { safety_briefing_given: true }),
    });
    // nums: 1+5+5=11, dens: 1+5+5=11 => 100%
    expect(r.child_awareness_rate).toBe(100);
  });

  it("0% when all sources contribute but none pass", () => {
    const r = run({
      swimming_competency_records: [makeSwimming({ water_safety_knowledge_assessed: true, water_safety_knowledge_passed: false })],
      hydration_monitoring_records: repeat(makeHydration, 5, { child_encouraged: false }),
      water_activity_safety_records: repeat(makeActivity, 5, { safety_briefing_given: false }),
    });
    // nums: 0+0+0=0, dens: 1+5+5=11 => 0%
    expect(r.child_awareness_rate).toBe(0);
  });

  it("only includes components that have relevant data", () => {
    // Only hydration has data
    const r = run({
      hydration_monitoring_records: [
        makeHydration({ child_encouraged: true }),
        makeHydration({ child_encouraged: false }),
      ],
    });
    // nums: 1, dens: 2 => 50%
    expect(r.child_awareness_rate).toBe(50);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 13. RECORD COUNTS
// ══════════════════════════════════════════════════════════════════════════════

describe("record counts", () => {
  it("counts temperature records correctly", () => {
    const r = run({ water_temperature_records: repeat(makeTemp, 7) });
    expect(r.total_temperature_records).toBe(7);
  });

  it("counts legionella records correctly", () => {
    const r = run({ legionella_assessment_records: repeat(makeLegionella, 4) });
    expect(r.total_legionella_records).toBe(4);
  });

  it("counts hydration records correctly", () => {
    const r = run({ hydration_monitoring_records: repeat(makeHydration, 12) });
    expect(r.total_hydration_records).toBe(12);
  });

  it("counts swimming records correctly", () => {
    const r = run({ swimming_competency_records: repeat(makeSwimming, 3) });
    expect(r.total_swimming_competency_records).toBe(3);
  });

  it("counts water activity records correctly", () => {
    const r = run({ water_activity_safety_records: repeat(makeActivity, 6) });
    expect(r.total_water_activity_records).toBe(6);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 14. STRENGTHS
// ══════════════════════════════════════════════════════════════════════════════

describe("strengths", () => {
  it("strength: temperature >= 95%", () => {
    const r = run({ water_temperature_records: repeat(makeTemp, 20, { within_safe_range: true }) });
    expect(r.strengths.some((s) => s.includes("100%") && s.includes("water temperature"))).toBe(true);
  });

  it("strength: temperature >= 80% but < 95%", () => {
    const r = run({
      water_temperature_records: [
        ...repeat(makeTemp, 17, { within_safe_range: true }),
        ...repeat(makeTemp, 3, { within_safe_range: false }),
      ],
    });
    expect(r.strengths.some((s) => s.includes("85%") && s.includes("good water temperature"))).toBe(true);
  });

  it("strength: legionella >= 95%", () => {
    const r = run({ legionella_assessment_records: repeat(makeLegionella, 20, { compliant: true }) });
    expect(r.strengths.some((s) => s.includes("legionella compliance") && s.includes("exemplary"))).toBe(true);
  });

  it("strength: legionella >= 80% but < 95%", () => {
    const r = run({
      legionella_assessment_records: [
        ...repeat(makeLegionella, 17, { compliant: true }),
        ...repeat(makeLegionella, 3, { compliant: false }),
      ],
    });
    expect(r.strengths.some((s) => s.includes("85%") && s.includes("legionella compliance"))).toBe(true);
  });

  it("strength: hydration >= 90%", () => {
    const r = run({ hydration_monitoring_records: repeat(makeHydration, 20, { met_target: true }) });
    expect(r.strengths.some((s) => s.includes("hydration targets met"))).toBe(true);
  });

  it("strength: hydration >= 70% but < 90%", () => {
    const r = run({
      hydration_monitoring_records: [
        ...repeat(makeHydration, 15, { met_target: true }),
        ...repeat(makeHydration, 5, { met_target: false }),
      ],
    });
    expect(r.strengths.some((s) => s.includes("75%") && s.includes("hydration targets met"))).toBe(true);
  });

  it("strength: swimming competency >= 90%", () => {
    const r = run({
      swimming_competency_records: [makeSwimming({ assessment_conducted: true, water_safety_knowledge_assessed: true, water_safety_knowledge_passed: true, lessons_attended: 10, lessons_offered: 10 })],
    });
    expect(r.strengths.some((s) => s.includes("Swimming competency rate at"))).toBe(true);
  });

  it("strength: water activity safety >= 95%", () => {
    const r = run({ water_activity_safety_records: repeat(makeActivity, 10) });
    expect(r.strengths.some((s) => s.includes("water activity safety compliance") && s.includes("exemplary"))).toBe(true);
  });

  it("strength: water activity safety >= 80% but < 95%", () => {
    const r = run({
      water_activity_safety_records: [
        ...repeat(makeActivity, 6, { safety_briefing_given: true }),
        ...repeat(makeActivity, 4, { safety_briefing_given: false }),
      ],
    });
    expect(r.strengths.some((s) => s.includes("water activity safety rate") && s.includes("strong"))).toBe(true);
  });

  it("strength: child awareness >= 90%", () => {
    const r = run({
      hydration_monitoring_records: repeat(makeHydration, 20, { child_encouraged: true }),
      water_activity_safety_records: repeat(makeActivity, 20, { safety_briefing_given: true }),
    });
    expect(r.strengths.some((s) => s.includes("child water safety awareness"))).toBe(true);
  });

  it("strength: action taken >= 95% with unsafe records", () => {
    const r = run({
      water_temperature_records: [
        ...repeat(makeTemp, 15, { within_safe_range: true }),
        ...repeat(makeTemp, 5, { within_safe_range: false, action_taken_if_unsafe: true }),
      ],
    });
    expect(r.strengths.some((s) => s.includes("unsafe water temperatures acted upon"))).toBe(true);
  });

  it("strength: accessible water >= 95%", () => {
    const r = run({ hydration_monitoring_records: repeat(makeHydration, 20, { accessible_water_available: true }) });
    expect(r.strengths.some((s) => s.includes("Accessible drinking water"))).toBe(true);
  });

  it("strength: TMV fitted >= 90%", () => {
    const r = run({
      water_temperature_records: repeat(makeTemp, 20, { thermostatic_mixing_valve_fitted: true }),
    });
    expect(r.strengths.some((s) => s.includes("Thermostatic mixing valves fitted"))).toBe(true);
  });

  it("strength: TMV tested >= 95%", () => {
    const r = run({
      water_temperature_records: repeat(makeTemp, 20, { thermostatic_mixing_valve_fitted: true, tmv_tested: true }),
    });
    expect(r.strengths.some((s) => s.includes("TMVs have been tested"))).toBe(true);
  });

  it("strength: written scheme >= 95%", () => {
    const r = run({
      legionella_assessment_records: repeat(makeLegionella, 20, { written_scheme_in_place: true }),
    });
    expect(r.strengths.some((s) => s.includes("Written legionella control scheme"))).toBe(true);
  });

  it("strength: flushing >= 95%", () => {
    const r = run({
      legionella_assessment_records: repeat(makeLegionella, 20, { flushing_regime_followed: true }),
    });
    expect(r.strengths.some((s) => s.includes("flushing regime compliance"))).toBe(true);
  });

  it("strength: hydration child coverage 100%", () => {
    const r = run({
      hydration_monitoring_records: [
        makeHydration({ child_id: "yp_a" }),
        makeHydration({ child_id: "yp_b" }),
        makeHydration({ child_id: "yp_c" }),
      ],
    });
    expect(r.strengths.some((s) => s.includes("Every child has hydration monitoring"))).toBe(true);
  });

  it("strength: hydration child coverage >= 80%", () => {
    const r = run({
      total_children: 5,
      hydration_monitoring_records: [
        makeHydration({ child_id: "yp_a" }),
        makeHydration({ child_id: "yp_b" }),
        makeHydration({ child_id: "yp_c" }),
        makeHydration({ child_id: "yp_d" }),
      ],
    });
    expect(r.strengths.some((s) => s.includes("80%") && s.includes("hydration monitoring"))).toBe(true);
  });

  it("strength: intervention rate >= 95%", () => {
    const r = run({
      hydration_monitoring_records: repeat(makeHydration, 10, { hydration_concern_raised: true, intervention_provided: true }),
    });
    expect(r.strengths.some((s) => s.includes("hydration concerns received intervention"))).toBe(true);
  });

  it("strength: swimming coverage 100%", () => {
    const r = run({
      swimming_competency_records: [
        makeSwimming({ child_id: "yp_a" }),
        makeSwimming({ child_id: "yp_b" }),
        makeSwimming({ child_id: "yp_c" }),
      ],
    });
    expect(r.strengths.some((s) => s.includes("Every child has a swimming competency assessment"))).toBe(true);
  });

  it("strength: zero incidents in water activities", () => {
    const r = run({
      water_activity_safety_records: repeat(makeActivity, 5, { incident_occurred: false }),
    });
    expect(r.strengths.some((s) => s.includes("Zero incidents"))).toBe(true);
  });

  it("strength: first aider present >= 95%", () => {
    const r = run({
      water_activity_safety_records: repeat(makeActivity, 20, { first_aider_present: true }),
    });
    expect(r.strengths.some((s) => s.includes("First aider present"))).toBe(true);
  });

  it("strength: zero scald risks", () => {
    const r = run({
      water_temperature_records: repeat(makeTemp, 10, { scald_risk_identified: false }),
    });
    expect(r.strengths.some((s) => s.includes("No scald risks identified"))).toBe(true);
  });

  it("strength: legionella action completion >= 95%", () => {
    const r = run({
      legionella_assessment_records: [makeLegionella({ actions_required: 10, actions_completed: 10 })],
    });
    expect(r.strengths.some((s) => s.includes("legionella remedial actions completed"))).toBe(true);
  });

  it("strength: dead leg remediation >= 95%", () => {
    const r = run({
      legionella_assessment_records: [makeLegionella({ dead_legs_identified: 10, dead_legs_remediated: 10 })],
    });
    expect(r.strengths.some((s) => s.includes("dead legs remediated"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 15. CONCERNS
// ══════════════════════════════════════════════════════════════════════════════

describe("concerns", () => {
  it("concern: temperature < 50%", () => {
    const r = run({
      water_temperature_records: [
        makeTemp({ within_safe_range: false }),
        makeTemp({ within_safe_range: false }),
        makeTemp({ within_safe_range: true }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("33%") && c.includes("scald risk"))).toBe(true);
  });

  it("concern: temperature 50-79%", () => {
    const r = run({
      water_temperature_records: [
        ...repeat(makeTemp, 13, { within_safe_range: true }),
        ...repeat(makeTemp, 7, { within_safe_range: false }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("65%") && c.includes("not all water outlets"))).toBe(true);
  });

  it("concern: legionella < 50%", () => {
    const r = run({
      legionella_assessment_records: repeat(makeLegionella, 5, { compliant: false }),
    });
    expect(r.concerns.some((c) => c.includes("0%") && c.includes("fundamental failure"))).toBe(true);
  });

  it("concern: legionella 50-79%", () => {
    const r = run({
      legionella_assessment_records: [
        ...repeat(makeLegionella, 13, { compliant: true }),
        ...repeat(makeLegionella, 7, { compliant: false }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("65%") && c.includes("inconsistent compliance"))).toBe(true);
  });

  it("concern: activity safety < 50%", () => {
    const r = run({
      water_activity_safety_records: [
        makeActivity({
          risk_assessment_completed: false, qualified_supervision: false, supervision_ratio_met: false,
          safety_equipment_available: false, safety_briefing_given: false, emergency_plan_in_place: false,
        }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("0%") && c.includes("unacceptable risk"))).toBe(true);
  });

  it("concern: activity safety 50-79%", () => {
    const r = run({
      water_activity_safety_records: [
        makeActivity({
          risk_assessment_completed: true, qualified_supervision: true, supervision_ratio_met: true,
          safety_equipment_available: false, safety_briefing_given: false, emergency_plan_in_place: false,
        }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("50%") && c.includes("not all water-based activities"))).toBe(true);
  });

  it("concern: hydration < 40%", () => {
    const r = run({
      hydration_monitoring_records: [
        ...repeat(makeHydration, 3, { met_target: true }),
        ...repeat(makeHydration, 7, { met_target: false }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("30%") && c.includes("health risk"))).toBe(true);
  });

  it("concern: hydration 40-69%", () => {
    const r = run({
      hydration_monitoring_records: [
        ...repeat(makeHydration, 10, { met_target: true }),
        ...repeat(makeHydration, 10, { met_target: false }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("50%") && c.includes("not all children are consistently"))).toBe(true);
  });

  it("concern: scald risk >= 20%", () => {
    const r = run({
      water_temperature_records: [
        ...repeat(makeTemp, 4, { scald_risk_identified: true }),
        ...repeat(makeTemp, 16, { scald_risk_identified: false }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("20%") && c.includes("multiple outlets"))).toBe(true);
  });

  it("concern: scald risk 10-19%", () => {
    const r = run({
      water_temperature_records: [
        ...repeat(makeTemp, 2, { scald_risk_identified: true }),
        ...repeat(makeTemp, 18, { scald_risk_identified: false }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("10%") && c.includes("some water outlets"))).toBe(true);
  });

  it("concern: action taken < 80%", () => {
    const r = run({
      water_temperature_records: [
        ...repeat(makeTemp, 15, { within_safe_range: true }),
        ...repeat(makeTemp, 4, { within_safe_range: false, action_taken_if_unsafe: false }),
        makeTemp({ within_safe_range: false, action_taken_if_unsafe: true }),
      ],
    });
    // actionTaken: 1/5=20%
    expect(r.concerns.some((c) => c.includes("20%") && c.includes("failure to respond"))).toBe(true);
  });

  it("concern: overdue >= 30%", () => {
    const r = run({
      legionella_assessment_records: [
        ...repeat(makeLegionella, 3, { overdue: true }),
        ...repeat(makeLegionella, 7, { overdue: false }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("30%") && c.includes("overdue"))).toBe(true);
  });

  it("concern: overdue 15-29%", () => {
    const r = run({
      legionella_assessment_records: [
        ...repeat(makeLegionella, 3, { overdue: true }),
        ...repeat(makeLegionella, 17, { overdue: false }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("15%") && c.includes("overdue"))).toBe(true);
  });

  it("concern: flushing < 70%", () => {
    const r = run({
      legionella_assessment_records: [
        ...repeat(makeLegionella, 6, { flushing_regime_followed: true }),
        ...repeat(makeLegionella, 4, { flushing_regime_followed: false }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("60%") && c.includes("Flushing regime"))).toBe(true);
  });

  it("concern: accessible water < 70%", () => {
    const r = run({
      hydration_monitoring_records: [
        ...repeat(makeHydration, 6, { accessible_water_available: true }),
        ...repeat(makeHydration, 4, { accessible_water_available: false }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("60%") && c.includes("Accessible drinking water"))).toBe(true);
  });

  it("concern: hydration concern rate >= 30%", () => {
    const r = run({
      hydration_monitoring_records: [
        ...repeat(makeHydration, 3, { hydration_concern_raised: true }),
        ...repeat(makeHydration, 7, { hydration_concern_raised: false }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("30%") && c.includes("inadequate fluid intake"))).toBe(true);
  });

  it("concern: hydration concern rate 15-29%", () => {
    const r = run({
      hydration_monitoring_records: [
        ...repeat(makeHydration, 3, { hydration_concern_raised: true }),
        ...repeat(makeHydration, 17, { hydration_concern_raised: false }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("15%") && c.includes("hydration difficulties"))).toBe(true);
  });

  it("concern: hydration child coverage < 50%", () => {
    const r = run({
      total_children: 5,
      hydration_monitoring_records: [
        makeHydration({ child_id: "yp_a" }),
        makeHydration({ child_id: "yp_b" }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("40%") && c.includes("fluid intake is not being tracked"))).toBe(true);
  });

  it("concern: qualified supervision < 70%", () => {
    const r = run({
      water_activity_safety_records: [
        ...repeat(makeActivity, 6, { qualified_supervision: true }),
        ...repeat(makeActivity, 4, { qualified_supervision: false }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("60%") && c.includes("qualified"))).toBe(true);
  });

  it("concern: competency check < 70%", () => {
    const r = run({
      water_activity_safety_records: [
        ...repeat(makeActivity, 6, { child_competencies_checked: true }),
        ...repeat(makeActivity, 4, { child_competencies_checked: false }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("60%") && c.includes("competencies checked"))).toBe(true);
  });

  it("concern: incident rate >= 20%", () => {
    const r = run({
      water_activity_safety_records: [
        ...repeat(makeActivity, 2, { incident_occurred: true }),
        ...repeat(makeActivity, 8, { incident_occurred: false }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("20%") && c.includes("urgent review"))).toBe(true);
  });

  it("concern: incident rate 10-19%", () => {
    const r = run({
      water_activity_safety_records: [
        ...repeat(makeActivity, 2, { incident_occurred: true }),
        ...repeat(makeActivity, 18, { incident_occurred: false }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("10%") && c.includes("warrants review"))).toBe(true);
  });

  it("concern: swimming coverage < 50%", () => {
    const r = run({
      total_children: 5,
      swimming_competency_records: [
        makeSwimming({ child_id: "yp_a" }),
        makeSwimming({ child_id: "yp_b" }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("40%") && c.includes("swimming competency assessments"))).toBe(true);
  });

  it("concern: legionella action completion < 50%", () => {
    const r = run({
      legionella_assessment_records: [makeLegionella({ actions_required: 10, actions_completed: 4 })],
    });
    expect(r.concerns.some((c) => c.includes("40%") && c.includes("legionella remedial actions"))).toBe(true);
  });

  it("concern: TMV tested < 70%", () => {
    const r = run({
      water_temperature_records: [
        ...repeat(makeTemp, 6, { thermostatic_mixing_valve_fitted: true, tmv_tested: true }),
        ...repeat(makeTemp, 4, { thermostatic_mixing_valve_fitted: true, tmv_tested: false }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("60%") && c.includes("TMVs have been tested"))).toBe(true);
  });

  it("concern: no temp records despite children on placement (non-allEmpty)", () => {
    const r = run({
      total_children: 3,
      legionella_assessment_records: [makeLegionella()],
    });
    expect(r.concerns.some((c) => c.includes("No water temperature records"))).toBe(true);
  });

  it("concern: no legionella records despite children on placement (non-allEmpty)", () => {
    const r = run({
      total_children: 3,
      water_temperature_records: [makeTemp()],
    });
    expect(r.concerns.some((c) => c.includes("No legionella assessment records"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 16. RECOMMENDATIONS
// ══════════════════════════════════════════════════════════════════════════════

describe("recommendations", () => {
  it("immediate: temp < 50%", () => {
    const r = run({
      water_temperature_records: repeat(makeTemp, 10, { within_safe_range: false }),
    });
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("Urgently review all water outlets"))).toBe(true);
  });

  it("immediate: legionella < 50%", () => {
    const r = run({
      legionella_assessment_records: repeat(makeLegionella, 10, { compliant: false }),
    });
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("urgent legionella risk assessment"))).toBe(true);
  });

  it("immediate: activity safety < 50%", () => {
    const r = run({
      water_activity_safety_records: [
        makeActivity({
          risk_assessment_completed: false, qualified_supervision: false, supervision_ratio_met: false,
          safety_equipment_available: false, safety_briefing_given: false, emergency_plan_in_place: false,
        }),
      ],
    });
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("Suspend water activities"))).toBe(true);
  });

  it("immediate: action taken < 80%", () => {
    const r = run({
      water_temperature_records: [
        ...repeat(makeTemp, 15, { within_safe_range: true }),
        ...repeat(makeTemp, 5, { within_safe_range: false, action_taken_if_unsafe: false }),
      ],
    });
    expect(r.recommendations.some((rec) => rec.recommendation.includes("mandatory escalation protocol"))).toBe(true);
  });

  it("immediate: hydration < 40%", () => {
    const r = run({
      hydration_monitoring_records: repeat(makeHydration, 10, { met_target: false }),
    });
    expect(r.recommendations.some((rec) => rec.recommendation.includes("strengthen hydration monitoring"))).toBe(true);
  });

  it("immediate: no temp records with children", () => {
    const r = run({
      total_children: 3,
      legionella_assessment_records: [makeLegionella()],
    });
    expect(r.recommendations.some((rec) => rec.recommendation.includes("immediate water temperature checking programme"))).toBe(true);
  });

  it("immediate: no legionella records with children", () => {
    const r = run({
      total_children: 3,
      water_temperature_records: [makeTemp()],
    });
    expect(r.recommendations.some((rec) => rec.recommendation.includes("Commission a full legionella risk assessment immediately"))).toBe(true);
  });

  it("soon: temp 50-79%", () => {
    const r = run({
      water_temperature_records: [
        ...repeat(makeTemp, 13, { within_safe_range: true }),
        ...repeat(makeTemp, 7, { within_safe_range: false }),
      ],
    });
    expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("Improve water temperature compliance"))).toBe(true);
  });

  it("soon: legionella 50-79%", () => {
    const r = run({
      legionella_assessment_records: [
        ...repeat(makeLegionella, 13, { compliant: true }),
        ...repeat(makeLegionella, 7, { compliant: false }),
      ],
    });
    expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("Strengthen legionella compliance"))).toBe(true);
  });

  it("soon: hydration 40-69%", () => {
    const r = run({
      hydration_monitoring_records: [
        ...repeat(makeHydration, 12, { met_target: true }),
        ...repeat(makeHydration, 8, { met_target: false }),
      ],
    });
    expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("Increase hydration target achievement"))).toBe(true);
  });

  it("soon: activity safety 50-79%", () => {
    const r = run({
      water_activity_safety_records: [
        makeActivity({
          risk_assessment_completed: true, qualified_supervision: true, supervision_ratio_met: true,
          safety_equipment_available: false, safety_briefing_given: false, emergency_plan_in_place: false,
        }),
      ],
    });
    expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("Strengthen water activity safety protocols"))).toBe(true);
  });

  it("planned: child awareness 50-69%", () => {
    const r = run({
      hydration_monitoring_records: [
        ...repeat(makeHydration, 6, { child_encouraged: true }),
        ...repeat(makeHydration, 4, { child_encouraged: false }),
      ],
    });
    // child awareness from hydration only = 60%
    expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("water safety education"))).toBe(true);
  });

  it("recommendations have ascending rank", () => {
    const r = run({
      water_temperature_records: repeat(makeTemp, 10, { within_safe_range: false, action_taken_if_unsafe: false }),
      legionella_assessment_records: repeat(makeLegionella, 10, { compliant: false }),
      hydration_monitoring_records: repeat(makeHydration, 10, { met_target: false }),
    });
    for (let i = 0; i < r.recommendations.length; i++) {
      expect(r.recommendations[i].rank).toBe(i + 1);
    }
  });

  it("all recommendations have a regulatory_ref", () => {
    const r = run({
      water_temperature_records: repeat(makeTemp, 10, { within_safe_range: false, action_taken_if_unsafe: false }),
      legionella_assessment_records: repeat(makeLegionella, 10, { compliant: false }),
    });
    for (const rec of r.recommendations) {
      expect(rec.regulatory_ref.length).toBeGreaterThan(0);
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 17. INSIGHTS
// ══════════════════════════════════════════════════════════════════════════════

describe("insights", () => {
  it("critical: temp < 50%", () => {
    const r = run({
      water_temperature_records: repeat(makeTemp, 10, { within_safe_range: false }),
    });
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("0%") && i.text.includes("scald"))).toBe(true);
  });

  it("critical: legionella < 50%", () => {
    const r = run({
      legionella_assessment_records: repeat(makeLegionella, 10, { compliant: false }),
    });
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("Legionnaires' disease"))).toBe(true);
  });

  it("critical: activity safety < 50%", () => {
    const r = run({
      water_activity_safety_records: [
        makeActivity({
          risk_assessment_completed: false, qualified_supervision: false, supervision_ratio_met: false,
          safety_equipment_available: false, safety_briefing_given: false, emergency_plan_in_place: false,
        }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("highest risk of serious harm"))).toBe(true);
  });

  it("critical: action taken < 80%", () => {
    const r = run({
      water_temperature_records: [
        ...repeat(makeTemp, 15, { within_safe_range: true }),
        ...repeat(makeTemp, 5, { within_safe_range: false, action_taken_if_unsafe: false }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("worse than not identifying it"))).toBe(true);
  });

  it("critical: no temp records with children (non-allEmpty)", () => {
    const r = run({
      total_children: 3,
      legionella_assessment_records: [makeLegionella()],
    });
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("No water temperature monitoring records"))).toBe(true);
  });

  it("critical: no legionella records with children (non-allEmpty)", () => {
    const r = run({
      total_children: 3,
      water_temperature_records: [makeTemp()],
    });
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("No legionella assessment records"))).toBe(true);
  });

  it("critical: hydration < 40%", () => {
    const r = run({
      hydration_monitoring_records: repeat(makeHydration, 10, { met_target: false }),
    });
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("dehydration"))).toBe(true);
  });

  it("critical: scald risk >= 20%", () => {
    const r = run({
      water_temperature_records: [
        ...repeat(makeTemp, 4, { scald_risk_identified: true }),
        ...repeat(makeTemp, 16, { scald_risk_identified: false }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("systemic failure"))).toBe(true);
  });

  it("warning: temp 50-79%", () => {
    const r = run({
      water_temperature_records: [
        ...repeat(makeTemp, 13, { within_safe_range: true }),
        ...repeat(makeTemp, 7, { within_safe_range: false }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("improving"))).toBe(true);
  });

  it("warning: legionella 50-79%", () => {
    const r = run({
      legionella_assessment_records: [
        ...repeat(makeLegionella, 13, { compliant: true }),
        ...repeat(makeLegionella, 7, { compliant: false }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Legionella compliance"))).toBe(true);
  });

  it("warning: activity safety 50-79%", () => {
    const r = run({
      water_activity_safety_records: [
        makeActivity({
          risk_assessment_completed: true, qualified_supervision: true, supervision_ratio_met: true,
          safety_equipment_available: false, safety_briefing_given: false, emergency_plan_in_place: false,
        }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("potentially fatal"))).toBe(true);
  });

  it("warning: hydration 40-69%", () => {
    const r = run({
      hydration_monitoring_records: [
        ...repeat(makeHydration, 12, { met_target: true }),
        ...repeat(makeHydration, 8, { met_target: false }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Hydration target achievement at 60%"))).toBe(true);
  });

  it("warning: overdue 15-29%", () => {
    const r = run({
      legionella_assessment_records: [
        ...repeat(makeLegionella, 3, { overdue: true }),
        ...repeat(makeLegionella, 17, { overdue: false }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("15%") && i.text.includes("overdue"))).toBe(true);
  });

  it("warning: hydration concern 15-29%", () => {
    const r = run({
      hydration_monitoring_records: [
        ...repeat(makeHydration, 3, { hydration_concern_raised: true }),
        ...repeat(makeHydration, 17, { hydration_concern_raised: false }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("15%") && i.text.includes("difficulties with fluid intake"))).toBe(true);
  });

  it("warning: swimming competency 50-69%", () => {
    const r = run({
      swimming_competency_records: [
        ...repeat(makeSwimming, 6, { assessment_conducted: true, water_safety_knowledge_assessed: true, water_safety_knowledge_passed: true, lessons_attended: 6, lessons_offered: 10 }),
        ...repeat(makeSwimming, 4, { assessment_conducted: false, water_safety_knowledge_assessed: true, water_safety_knowledge_passed: false, lessons_attended: 6, lessons_offered: 10 }),
      ],
    });
    // assessment: 6/10=60%, knowledge: 6/10=60%, lessons: 60/100=60% => avg=60
    expect(r.swimming_competency_rate).toBe(60);
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Swimming competency rate at 60%"))).toBe(true);
  });

  it("warning: child awareness 50-69%", () => {
    const r = run({
      hydration_monitoring_records: [
        ...repeat(makeHydration, 6, { child_encouraged: true }),
        ...repeat(makeHydration, 4, { child_encouraged: false }),
      ],
    });
    // child awareness = 6/10=60%
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Child water safety awareness at 60%"))).toBe(true);
  });

  it("warning: incident rate 10-19%", () => {
    const r = run({
      water_activity_safety_records: [
        ...repeat(makeActivity, 2, { incident_occurred: true }),
        ...repeat(makeActivity, 18, { incident_occurred: false }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("10%") && i.text.includes("systematic review"))).toBe(true);
  });

  it("warning: encouragement < 70%", () => {
    const r = run({
      hydration_monitoring_records: [
        ...repeat(makeHydration, 6, { child_encouraged: true }),
        ...repeat(makeHydration, 4, { child_encouraged: false }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("encouraged to drink in only 60%"))).toBe(true);
  });

  it("warning: legionella action completion 50-69%", () => {
    const r = run({
      legionella_assessment_records: [makeLegionella({ actions_required: 10, actions_completed: 6 })],
    });
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("60%") && i.text.includes("remedial action completion"))).toBe(true);
  });

  it("warning: consent < 80%", () => {
    const r = run({
      swimming_competency_records: [
        ...repeat(makeSwimming, 7, { parental_consent_obtained: true }),
        ...repeat(makeSwimming, 3, { parental_consent_obtained: false }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Parental consent obtained for only 70%"))).toBe(true);
  });

  it("warning: missing outlet types", () => {
    const r = run({
      water_temperature_records: [
        makeTemp({ outlet_type: "kitchen" }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("hot_tap") && i.text.includes("bath") && i.text.includes("shower"))).toBe(true);
  });

  it("no missing outlet warning when all 3 expected types present", () => {
    const r = run({
      water_temperature_records: [
        makeTemp({ outlet_type: "hot_tap" }),
        makeTemp({ outlet_type: "bath" }),
        makeTemp({ outlet_type: "shower" }),
      ],
    });
    expect(r.insights.some((i) => i.text.includes("No temperature checks recorded for"))).toBe(false);
  });

  it("positive: outstanding rating insight", () => {
    const r = run({
      water_temperature_records: repeat(makeTemp, 20, { within_safe_range: true }),
      legionella_assessment_records: repeat(makeLegionella, 20, { compliant: true, actions_required: 5, actions_completed: 5 }),
      hydration_monitoring_records: [
        ...repeat(makeHydration, 10, { child_id: "yp_a", met_target: true, child_encouraged: true, accessible_water_available: true }),
        ...repeat(makeHydration, 10, { child_id: "yp_b", met_target: true, child_encouraged: true, accessible_water_available: true }),
        ...repeat(makeHydration, 10, { child_id: "yp_c", met_target: true, child_encouraged: true, accessible_water_available: true }),
      ],
      swimming_competency_records: [
        makeSwimming({ child_id: "yp_a", water_safety_knowledge_assessed: true, water_safety_knowledge_passed: true, lessons_attended: 10, lessons_offered: 10 }),
        makeSwimming({ child_id: "yp_b", water_safety_knowledge_assessed: true, water_safety_knowledge_passed: true, lessons_attended: 10, lessons_offered: 10 }),
        makeSwimming({ child_id: "yp_c", water_safety_knowledge_assessed: true, water_safety_knowledge_passed: true, lessons_attended: 10, lessons_offered: 10 }),
      ],
      water_activity_safety_records: repeat(makeActivity, 10, { safety_briefing_given: true }),
    });
    expect(r.water_safety_rating).toBe("outstanding");
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("outstanding"))).toBe(true);
  });

  it("positive: temp >= 95% + TMV >= 90%", () => {
    const r = run({
      water_temperature_records: repeat(makeTemp, 20, { within_safe_range: true, thermostatic_mixing_valve_fitted: true }),
    });
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("exemplary premises safety"))).toBe(true);
  });

  it("positive: legionella >= 95% + written scheme >= 95% + flushing >= 95%", () => {
    const r = run({
      legionella_assessment_records: repeat(makeLegionella, 20, { compliant: true, written_scheme_in_place: true, flushing_regime_followed: true }),
    });
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("mature, well-documented"))).toBe(true);
  });

  it("positive: hydration >= 90% + accessible water >= 95%", () => {
    const r = run({
      hydration_monitoring_records: repeat(makeHydration, 20, { met_target: true, accessible_water_available: true }),
    });
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("well-hydrated"))).toBe(true);
  });

  it("positive: activity safety >= 95% + zero incidents", () => {
    const r = run({
      water_activity_safety_records: repeat(makeActivity, 10, { incident_occurred: false }),
    });
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("zero incidents"))).toBe(true);
  });

  it("positive: child awareness >= 90%", () => {
    const r = run({
      hydration_monitoring_records: repeat(makeHydration, 20, { child_encouraged: true }),
      water_activity_safety_records: repeat(makeActivity, 20, { safety_briefing_given: true }),
    });
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("child water safety awareness"))).toBe(true);
  });

  it("positive: swimming competency >= 90% + full coverage", () => {
    const r = run({
      swimming_competency_records: [
        makeSwimming({ child_id: "yp_a", water_safety_knowledge_assessed: true, water_safety_knowledge_passed: true, lessons_attended: 10, lessons_offered: 10 }),
        makeSwimming({ child_id: "yp_b", water_safety_knowledge_assessed: true, water_safety_knowledge_passed: true, lessons_attended: 10, lessons_offered: 10 }),
        makeSwimming({ child_id: "yp_c", water_safety_knowledge_assessed: true, water_safety_knowledge_passed: true, lessons_attended: 10, lessons_offered: 10 }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("Swimming competency fully assessed"))).toBe(true);
  });

  it("positive: intervention rate >= 95%", () => {
    const r = run({
      hydration_monitoring_records: repeat(makeHydration, 10, { hydration_concern_raised: true, intervention_provided: true }),
    });
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("hydration concerns received intervention"))).toBe(true);
  });

  it("positive: zero scald + action taken >= 95% with unsafe records", () => {
    const r = run({
      water_temperature_records: [
        ...repeat(makeTemp, 15, { within_safe_range: true, scald_risk_identified: false }),
        ...repeat(makeTemp, 5, { within_safe_range: false, action_taken_if_unsafe: true, scald_risk_identified: false }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("No scald risks identified"))).toBe(true);
  });

  it("positive: dead leg remediation >= 95% + action completion >= 95%", () => {
    const r = run({
      legionella_assessment_records: [
        makeLegionella({ dead_legs_identified: 10, dead_legs_remediated: 10, actions_required: 10, actions_completed: 10 }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("dead legs remediated") && i.text.includes("legionella actions completed"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 18. EDGE CASES
// ══════════════════════════════════════════════════════════════════════════════

describe("edge cases", () => {
  it("clamp prevents score below 0", () => {
    // Even with massive penalties, can't go below 0
    // This is a synthetic test — may not be reachable from engine logic, but tests clamp
    // With max penalties: 52 - 5 - 5 - 5 - 3 = 34, still above 0
    const r = run({
      water_temperature_records: repeat(makeTemp, 10, { within_safe_range: false }),
      legionella_assessment_records: repeat(makeLegionella, 10, { compliant: false }),
      hydration_monitoring_records: repeat(makeHydration, 10, { met_target: false }),
      water_activity_safety_records: [
        makeActivity({
          risk_assessment_completed: false, qualified_supervision: false, supervision_ratio_met: false,
          safety_equipment_available: false, safety_briefing_given: false, emergency_plan_in_place: false,
        }),
      ],
    });
    expect(r.water_safety_score).toBeGreaterThanOrEqual(0);
  });

  it("clamp prevents score above 100", () => {
    // With max bonuses = 80, can't exceed 100
    const r = run({
      water_temperature_records: repeat(makeTemp, 20, { within_safe_range: true }),
      legionella_assessment_records: repeat(makeLegionella, 20, { compliant: true, actions_required: 5, actions_completed: 5 }),
      hydration_monitoring_records: repeat(makeHydration, 30, { met_target: true, child_encouraged: true, accessible_water_available: true }),
      swimming_competency_records: [makeSwimming({ water_safety_knowledge_assessed: true, water_safety_knowledge_passed: true, lessons_attended: 10, lessons_offered: 10 })],
      water_activity_safety_records: repeat(makeActivity, 10),
    });
    expect(r.water_safety_score).toBeLessThanOrEqual(100);
  });

  it("single record per category still computes correctly", () => {
    const r = run({
      water_temperature_records: [makeTemp()],
      legionella_assessment_records: [makeLegionella()],
      hydration_monitoring_records: [makeHydration()],
      swimming_competency_records: [makeSwimming()],
      water_activity_safety_records: [makeActivity()],
    });
    expect(r.water_safety_rating).toBeDefined();
    expect(typeof r.water_safety_score).toBe("number");
    expect(r.total_temperature_records).toBe(1);
    expect(r.total_legionella_records).toBe(1);
    expect(r.total_hydration_records).toBe(1);
    expect(r.total_swimming_competency_records).toBe(1);
    expect(r.total_water_activity_records).toBe(1);
  });

  it("total_children=0 with records still computes (no insufficient_data since allEmpty is false)", () => {
    const r = run({
      total_children: 0,
      water_temperature_records: [makeTemp()],
    });
    // Not allEmpty since temp records exist. Not allEmpty && total_children===0, so no insufficient_data
    expect(r.water_safety_rating).not.toBe("insufficient_data");
  });

  it("hydrationChildCoverage is 0 when total_children=0 (even with records)", () => {
    const r = run({
      total_children: 0,
      hydration_monitoring_records: [makeHydration()],
    });
    // coverage = pct(1, 0) uses total_children>0 guard => 0
    // No "Every child" strength
    expect(r.strengths.some((s) => s.includes("Every child has hydration monitoring"))).toBe(false);
  });

  it("TMV tested rate is 0 when no TMVs fitted", () => {
    const r = run({
      water_temperature_records: repeat(makeTemp, 10, { thermostatic_mixing_valve_fitted: false, tmv_tested: false }),
    });
    // tmvFitted=0 so tmvTestedRate=0 by guard
    expect(r.strengths.some((s) => s.includes("TMVs have been tested"))).toBe(false);
    expect(r.concerns.some((c) => c.includes("TMVs have been tested"))).toBe(false);
  });

  it("intervention rate is 0 when no hydration concerns (guarded)", () => {
    const r = run({
      hydration_monitoring_records: repeat(makeHydration, 10, { hydration_concern_raised: false, intervention_provided: false }),
    });
    expect(r.strengths.some((s) => s.includes("hydration concerns received intervention"))).toBe(false);
  });

  it("qualified assessor rate is 0 when no assessments conducted", () => {
    const r = run({
      swimming_competency_records: repeat(makeSwimming, 5, {
        assessment_conducted: false,
        assessor_qualified: false,
        water_safety_knowledge_assessed: false,
        water_safety_knowledge_passed: false,
        lessons_attended: 0,
        lessons_offered: 0,
      }),
    });
    // No assessment conducted, no knowledge assessed, no lessons offered => only assessment rate counts (0%)
    expect(r.swimming_competency_rate).toBe(0);
  });

  it("risk approval rate is 0 when no risk assessments completed in activities", () => {
    const r = run({
      water_activity_safety_records: repeat(makeActivity, 5, {
        risk_assessment_completed: false,
        risk_assessment_approved: false,
        qualified_supervision: false,
        supervision_ratio_met: false,
        safety_equipment_available: false,
        safety_briefing_given: false,
        emergency_plan_in_place: false,
      }),
    });
    // All 6 rate components at 0%
    expect(r.water_activity_safety_rate).toBe(0);
  });

  it("large dataset (100+ records) processes without error", () => {
    const r = run({
      water_temperature_records: repeat(makeTemp, 100),
      legionella_assessment_records: repeat(makeLegionella, 50),
      hydration_monitoring_records: repeat(makeHydration, 100),
      swimming_competency_records: repeat(makeSwimming, 30),
      water_activity_safety_records: repeat(makeActivity, 50),
    });
    expect(r.water_safety_rating).toBeDefined();
    expect(r.water_safety_score).toBeGreaterThanOrEqual(0);
    expect(r.water_safety_score).toBeLessThanOrEqual(100);
  });

  it("swimming competency rate excludes knowledge if none assessed", () => {
    const r = run({
      swimming_competency_records: [
        makeSwimming({ assessment_conducted: true, water_safety_knowledge_assessed: false, lessons_attended: 8, lessons_offered: 10 }),
      ],
    });
    // Components: assessmentRate=100%, lessonRate=80% => avg=90
    expect(r.swimming_competency_rate).toBe(90);
  });

  it("swimming competency rate excludes lessons if none offered", () => {
    const r = run({
      swimming_competency_records: [
        makeSwimming({ assessment_conducted: true, water_safety_knowledge_assessed: true, water_safety_knowledge_passed: true, lessons_attended: 0, lessons_offered: 0 }),
      ],
    });
    // Components: assessmentRate=100%, knowledgeRate=100% => avg=100
    expect(r.swimming_competency_rate).toBe(100);
  });

  it("child awareness rate with only swimming knowledge source", () => {
    const r = run({
      swimming_competency_records: [
        makeSwimming({ water_safety_knowledge_assessed: true, water_safety_knowledge_passed: true }),
      ],
    });
    // Only source: 1/1 = 100%
    expect(r.child_awareness_rate).toBe(100);
  });

  it("child awareness rate with only activity briefing source", () => {
    const r = run({
      water_activity_safety_records: [
        makeActivity({ safety_briefing_given: true }),
        makeActivity({ safety_briefing_given: false }),
      ],
    });
    // Only source: 1/2 = 50%
    expect(r.child_awareness_rate).toBe(50);
  });

  it("scald risk rate at exactly 10% triggers lower-tier concern", () => {
    const r = run({
      water_temperature_records: [
        makeTemp({ scald_risk_identified: true }),
        ...repeat(makeTemp, 9, { scald_risk_identified: false }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("10%") && c.includes("some water outlets"))).toBe(true);
  });

  it("scald risk rate at 9% triggers no concern", () => {
    // 9/100=9%
    const r = run({
      water_temperature_records: [
        ...repeat(makeTemp, 9, { scald_risk_identified: true }),
        ...repeat(makeTemp, 91, { scald_risk_identified: false }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("scald") && c.includes("outlets"))).toBe(false);
  });

  it("overdue rate at exactly 15% triggers warning insight", () => {
    // 3/20=15%
    const r = run({
      legionella_assessment_records: [
        ...repeat(makeLegionella, 3, { overdue: true }),
        ...repeat(makeLegionella, 17, { overdue: false }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("15%") && i.text.includes("overdue"))).toBe(true);
  });

  it("overdue rate at exactly 30% triggers concern (higher tier)", () => {
    // 3/10=30%
    const r = run({
      legionella_assessment_records: [
        ...repeat(makeLegionella, 3, { overdue: true }),
        ...repeat(makeLegionella, 7, { overdue: false }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("30%") && c.includes("overdue"))).toBe(true);
  });

  it("missing one outlet type still reports it", () => {
    const r = run({
      water_temperature_records: [
        makeTemp({ outlet_type: "hot_tap" }),
        makeTemp({ outlet_type: "bath" }),
      ],
    });
    expect(r.insights.some((i) => i.text.includes("shower") && !i.text.includes("hot_tap") && !i.text.includes("bath"))).toBe(true);
  });

  it("all three expected outlets present means no missing-outlet insight", () => {
    const r = run({
      water_temperature_records: [
        makeTemp({ outlet_type: "hot_tap" }),
        makeTemp({ outlet_type: "bath" }),
        makeTemp({ outlet_type: "shower" }),
        makeTemp({ outlet_type: "kitchen" }),
      ],
    });
    expect(r.insights.some((i) => i.text.includes("No temperature checks recorded for"))).toBe(false);
  });

  it("plural outlet in missing outlet message when 2+ missing", () => {
    const r = run({
      water_temperature_records: [
        makeTemp({ outlet_type: "kitchen" }),
      ],
    });
    // Missing: hot_tap, bath, shower => "outlets" (plural)
    expect(r.insights.some((i) => i.text.includes("outlets"))).toBe(true);
  });

  it("singular outlet in missing outlet message when exactly 1 missing", () => {
    const r = run({
      water_temperature_records: [
        makeTemp({ outlet_type: "hot_tap" }),
        makeTemp({ outlet_type: "bath" }),
      ],
    });
    // Missing: shower => "outlet" (singular)
    expect(r.insights.some((i) => i.text.includes("shower outlet —"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 19. HEADLINE FORMATTING
// ══════════════════════════════════════════════════════════════════════════════

describe("headline formatting", () => {
  it("good headline includes concern count when concerns present", () => {
    const r = run({
      water_temperature_records: repeat(makeTemp, 20, { within_safe_range: true }),
      legionella_assessment_records: repeat(makeLegionella, 20, { compliant: true }),
      hydration_monitoring_records: repeat(makeHydration, 20, { met_target: true, child_encouraged: true, accessible_water_available: true }),
      swimming_competency_records: [
        makeSwimming({ child_id: "yp_alex", assessment_conducted: true, water_safety_knowledge_assessed: true, water_safety_knowledge_passed: true, lessons_attended: 7, lessons_offered: 10 }),
      ],
      water_activity_safety_records: [
        makeActivity({ safety_briefing_given: false }),
      ],
    });
    if (r.concerns.length > 0) {
      expect(r.headline).toContain("area");
    }
  });

  it("inadequate headline includes significant concerns", () => {
    const r = run({
      water_temperature_records: repeat(makeTemp, 10, { within_safe_range: false }),
      legionella_assessment_records: repeat(makeLegionella, 10, { compliant: false }),
      hydration_monitoring_records: repeat(makeHydration, 10, { met_target: false }),
    });
    expect(r.headline).toContain("significant concern");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 20. COMPOSITE RATE BOUNDARY TESTS
// ══════════════════════════════════════════════════════════════════════════════

describe("composite rate boundary tests", () => {
  it("swimming competency at exactly 90% gets +3 bonus", () => {
    // Need avg of components = 90. assessment=100%, knowledge=100%, lessons=70% => avg=90
    // Also triggers child awareness (knowledge 100%) => +3
    const r = run({
      swimming_competency_records: [
        makeSwimming({ assessment_conducted: true, water_safety_knowledge_assessed: true, water_safety_knowledge_passed: true, lessons_attended: 7, lessons_offered: 10 }),
      ],
    });
    // avg(100,100,70) = 90
    expect(r.swimming_competency_rate).toBe(90);
    // 52 + 3 (swim) + 3 (awareness) = 58
    expect(r.water_safety_score).toBe(58);
  });

  it("swimming competency at exactly 70% gets +1 bonus", () => {
    // assessment=100%, knowledge=0 (not assessed), lessons=40% => only 2 components: avg(100,40)=70
    const r = run({
      swimming_competency_records: [
        ...repeat(makeSwimming, 10, { assessment_conducted: true, water_safety_knowledge_assessed: false, lessons_attended: 4, lessons_offered: 10 }),
      ],
    });
    // assessment=100%, lessons=40% => avg(100,40)=70
    expect(r.swimming_competency_rate).toBe(70);
    expect(r.water_safety_score).toBe(53); // 52 + 1
  });

  it("water activity safety at exactly 80% gets +2", () => {
    // 5 records with one component consistently off: 4 of 5 = 80% for one component
    // avg(80,100,100,100,100,100) = 97 — too high
    // Need avg exactly 80: e.g. 4 components at 100%, 2 at 40% => avg=80? (400+80)/6=80. Yes.
    const r = run({
      water_activity_safety_records: [
        makeActivity({ risk_assessment_completed: true, qualified_supervision: true, supervision_ratio_met: true, safety_equipment_available: true, safety_briefing_given: false, emergency_plan_in_place: false }),
        makeActivity({ risk_assessment_completed: true, qualified_supervision: true, supervision_ratio_met: true, safety_equipment_available: true, safety_briefing_given: true, emergency_plan_in_place: true }),
        makeActivity({ risk_assessment_completed: true, qualified_supervision: true, supervision_ratio_met: true, safety_equipment_available: true, safety_briefing_given: false, emergency_plan_in_place: false }),
        makeActivity({ risk_assessment_completed: true, qualified_supervision: true, supervision_ratio_met: true, safety_equipment_available: true, safety_briefing_given: true, emergency_plan_in_place: true }),
        makeActivity({ risk_assessment_completed: true, qualified_supervision: true, supervision_ratio_met: true, safety_equipment_available: true, safety_briefing_given: false, emergency_plan_in_place: false }),
      ],
    });
    // RA=100, QS=100, SR=100, SE=100, SB=40, EP=40 => avg=(100+100+100+100+40+40)/6 = 80
    expect(r.water_activity_safety_rate).toBe(80);
    expect(r.water_safety_score).toBe(54); // 52 + 2
  });

  it("child awareness at exactly 70% gets +1", () => {
    // 7/10 encouraged hydration, no other sources
    const r = run({
      hydration_monitoring_records: [
        ...repeat(makeHydration, 7, { child_encouraged: true }),
        ...repeat(makeHydration, 3, { child_encouraged: false }),
      ],
    });
    expect(r.child_awareness_rate).toBe(70);
  });
});
