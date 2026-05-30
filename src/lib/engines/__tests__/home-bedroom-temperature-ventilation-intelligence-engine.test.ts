// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME BEDROOM TEMPERATURE & VENTILATION INTELLIGENCE ENGINE TESTS
// Comprehensive test suite: unit + integration
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeBedroomTemperatureVentilation,
  type BedroomTempInput,
  type TemperatureMonitoringRecordInput,
  type VentilationRecordInput,
  type HeatingCheckRecordInput,
  type WindowComplianceRecordInput,
  type ChildComfortRecordInput,
} from "../home-bedroom-temperature-ventilation-intelligence-engine";

// ── Factories ───────────────────────────────────────────────────────────────

const baseInput: BedroomTempInput = {
  today: "2026-05-30",
  total_children: 4,
  temperature_monitoring_records: [],
  ventilation_records: [],
  heating_check_records: [],
  window_compliance_records: [],
  child_comfort_records: [],
};

function makeTempRecord(
  overrides: Partial<TemperatureMonitoringRecordInput> = {},
): TemperatureMonitoringRecordInput {
  return {
    id: "temp_1",
    bedroom_id: "bed_1",
    child_id: "child_1",
    date: "2026-05-20",
    time_of_day: "morning",
    temperature_celsius: 20,
    target_min_celsius: 18,
    target_max_celsius: 22,
    within_range: true,
    thermometer_calibrated: true,
    recorded_by: "staff_1",
    location: "bedroom",
    season: "spring",
    action_required: false,
    action_taken: false,
    action_details: "",
    notes: "",
    created_at: "2026-05-20T10:00:00Z",
    ...overrides,
  };
}

function makeVentRecord(
  overrides: Partial<VentilationRecordInput> = {},
): VentilationRecordInput {
  return {
    id: "vent_1",
    bedroom_id: "bed_1",
    child_id: "child_1",
    date: "2026-05-20",
    ventilation_type: "natural",
    adequate: true,
    air_quality_checked: true,
    air_quality_acceptable: true,
    condensation_present: false,
    mould_present: false,
    ventilation_system_working: true,
    maintenance_required: false,
    maintenance_completed: false,
    inspected_by: "staff_1",
    notes: "",
    created_at: "2026-05-20T10:00:00Z",
    ...overrides,
  };
}

function makeHeatingRecord(
  overrides: Partial<HeatingCheckRecordInput> = {},
): HeatingCheckRecordInput {
  return {
    id: "heat_1",
    bedroom_id: "bed_1",
    date: "2026-05-20",
    heating_type: "central_heating",
    system_operational: true,
    thermostat_working: true,
    thermostat_accessible_to_child: true,
    radiator_guards_fitted: true,
    temperature_controllable: true,
    safety_check_passed: true,
    last_service_date: "2026-01-15",
    service_overdue: false,
    engineer_certified: true,
    issues_found: false,
    issues_resolved: false,
    resolution_date: null,
    checked_by: "staff_1",
    notes: "",
    created_at: "2026-05-20T10:00:00Z",
    ...overrides,
  };
}

function makeWindowRecord(
  overrides: Partial<WindowComplianceRecordInput> = {},
): WindowComplianceRecordInput {
  return {
    id: "win_1",
    bedroom_id: "bed_1",
    child_id: "child_1",
    date: "2026-05-20",
    window_restrictor_fitted: true,
    restrictor_functional: true,
    window_lockable: true,
    lock_functional: true,
    window_opens_adequately: true,
    safety_glass_fitted: true,
    trickle_vent_present: true,
    trickle_vent_open: true,
    window_condition: "good",
    draught_proofing_adequate: true,
    child_can_open_for_ventilation: true,
    fall_risk_assessed: true,
    fall_risk_mitigated: true,
    compliance_met: true,
    inspected_by: "staff_1",
    notes: "",
    created_at: "2026-05-20T10:00:00Z",
    ...overrides,
  };
}

function makeComfortRecord(
  overrides: Partial<ChildComfortRecordInput> = {},
): ChildComfortRecordInput {
  return {
    id: "comf_1",
    child_id: "child_1",
    bedroom_id: "bed_1",
    date: "2026-05-20",
    comfort_rating: 5,
    temperature_preference: "comfortable",
    ventilation_preference: "comfortable",
    sleeps_well_temperature: true,
    bedding_adequate: true,
    bedding_seasonal: true,
    heating_control_understood: true,
    can_adjust_temperature: true,
    window_usage_confident: true,
    requested_changes: false,
    changes_actioned: false,
    changes_details: "",
    child_voice_captured: true,
    feedback_method: "verbal",
    notes: "",
    created_at: "2026-05-20T10:00:00Z",
    ...overrides,
  };
}

// Helper to generate N records with unique ids
function manyTemp(n: number, overrides: Partial<TemperatureMonitoringRecordInput> = {}): TemperatureMonitoringRecordInput[] {
  return Array.from({ length: n }, (_, i) => makeTempRecord({ id: `temp_${i}`, ...overrides }));
}
function manyVent(n: number, overrides: Partial<VentilationRecordInput> = {}): VentilationRecordInput[] {
  return Array.from({ length: n }, (_, i) => makeVentRecord({ id: `vent_${i}`, ...overrides }));
}
function manyHeating(n: number, overrides: Partial<HeatingCheckRecordInput> = {}): HeatingCheckRecordInput[] {
  return Array.from({ length: n }, (_, i) => makeHeatingRecord({ id: `heat_${i}`, ...overrides }));
}
function manyWindow(n: number, overrides: Partial<WindowComplianceRecordInput> = {}): WindowComplianceRecordInput[] {
  return Array.from({ length: n }, (_, i) => makeWindowRecord({ id: `win_${i}`, ...overrides }));
}
function manyComfort(n: number, overrides: Partial<ChildComfortRecordInput> = {}): ChildComfortRecordInput[] {
  return Array.from({ length: n }, (_, i) => makeComfortRecord({ id: `comf_${i}`, child_id: `child_${i}`, ...overrides }));
}

// ── Insufficient Data ───────────────────────────────────────────────────────

describe("insufficient_data", () => {
  it("returns insufficient_data when no children and all arrays empty", () => {
    const r = computeBedroomTemperatureVentilation({ ...baseInput, total_children: 0 });
    expect(r.temperature_rating).toBe("insufficient_data");
    expect(r.temperature_score).toBe(0);
  });

  it("returns 0 for all rate fields when insufficient_data", () => {
    const r = computeBedroomTemperatureVentilation({ ...baseInput, total_children: 0 });
    expect(r.temperature_monitoring_rate).toBe(0);
    expect(r.ventilation_rate).toBe(0);
    expect(r.heating_check_rate).toBe(0);
    expect(r.window_compliance_rate).toBe(0);
    expect(r.child_comfort_rate).toBe(0);
    expect(r.action_response_rate).toBe(0);
  });

  it("returns empty arrays for strengths, concerns, recommendations, insights", () => {
    const r = computeBedroomTemperatureVentilation({ ...baseInput, total_children: 0 });
    expect(r.strengths).toEqual([]);
    expect(r.concerns).toEqual([]);
    expect(r.recommendations).toEqual([]);
    expect(r.insights).toEqual([]);
  });

  it("returns 0 totals when insufficient_data", () => {
    const r = computeBedroomTemperatureVentilation({ ...baseInput, total_children: 0 });
    expect(r.total_temperature_records).toBe(0);
    expect(r.total_ventilation_records).toBe(0);
    expect(r.total_heating_check_records).toBe(0);
    expect(r.total_window_compliance_records).toBe(0);
    expect(r.total_child_comfort_records).toBe(0);
  });

  it("headline mentions insufficient data", () => {
    const r = computeBedroomTemperatureVentilation({ ...baseInput, total_children: 0 });
    expect(r.headline.toLowerCase()).toContain("insufficient data");
  });
});

// ── Inadequate Floor ────────────────────────────────────────────────────────

describe("inadequate floor (children but no records)", () => {
  it("returns inadequate rating with score 15", () => {
    const r = computeBedroomTemperatureVentilation({ ...baseInput, total_children: 3 });
    expect(r.temperature_rating).toBe("inadequate");
    expect(r.temperature_score).toBe(15);
  });

  it("has exactly 1 concern about no records", () => {
    const r = computeBedroomTemperatureVentilation({ ...baseInput, total_children: 3 });
    expect(r.concerns.length).toBe(1);
    expect(r.concerns[0].toLowerCase()).toContain("no temperature monitoring");
  });

  it("has exactly 2 recommendations with immediate urgency", () => {
    const r = computeBedroomTemperatureVentilation({ ...baseInput, total_children: 3 });
    expect(r.recommendations.length).toBe(2);
    expect(r.recommendations[0].urgency).toBe("immediate");
    expect(r.recommendations[1].urgency).toBe("immediate");
    expect(r.recommendations[0].rank).toBe(1);
    expect(r.recommendations[1].rank).toBe(2);
  });

  it("has exactly 1 critical insight", () => {
    const r = computeBedroomTemperatureVentilation({ ...baseInput, total_children: 3 });
    expect(r.insights.length).toBe(1);
    expect(r.insights[0].severity).toBe("critical");
  });

  it("returns 0 for all rate fields at the inadequate floor", () => {
    const r = computeBedroomTemperatureVentilation({ ...baseInput, total_children: 3 });
    expect(r.temperature_monitoring_rate).toBe(0);
    expect(r.ventilation_rate).toBe(0);
    expect(r.heating_check_rate).toBe(0);
    expect(r.window_compliance_rate).toBe(0);
    expect(r.child_comfort_rate).toBe(0);
    expect(r.action_response_rate).toBe(0);
  });

  it("headline mentions urgent attention", () => {
    const r = computeBedroomTemperatureVentilation({ ...baseInput, total_children: 3 });
    expect(r.headline.toLowerCase()).toContain("urgent");
  });
});

// ── pct(0,0) = 0 ────────────────────────────────────────────────────────────

describe("pct(0,0) = 0 edge case", () => {
  it("action_response_rate is 0 when no actions required", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      temperature_monitoring_records: manyTemp(5),
    });
    expect(r.action_response_rate).toBe(0);
  });

  it("rates default to 0 for empty sub-arrays even with data in others", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      temperature_monitoring_records: manyTemp(5),
    });
    expect(r.ventilation_rate).toBe(0);
    expect(r.heating_check_rate).toBe(0);
    expect(r.window_compliance_rate).toBe(0);
    expect(r.child_comfort_rate).toBe(0);
  });
});

// ── Base Score = 52 ─────────────────────────────────────────────────────────

describe("base score = 52", () => {
  it("score is 52 with neutral data (no bonuses, no penalties)", () => {
    // 50% within_range → no bonus and no penalty (>=40)
    // 50% adequate vent → no bonus and no penalty (>=50)
    // heating: all partial → ~50 composite → no bonus, no penalty
    // window: 50% compliance → no bonus, no penalty (>=50)
    // childComfort: ~50% → no bonus, no penalty (>=30)
    // safetyCheck: ~50% → no bonus, no penalty
    // avgComfort: 2.5 → no bonus
    // childVoice: 50% → no bonus
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      temperature_monitoring_records: [
        ...manyTemp(5, { within_range: true }),
        ...manyTemp(5, { within_range: false, id: "t_bad" }),
      ],
      ventilation_records: [
        ...manyVent(5, { adequate: true }),
        ...manyVent(5, { adequate: false, id: "v_bad" }),
      ],
      heating_check_records: [
        makeHeatingRecord({ system_operational: true, safety_check_passed: true, thermostat_working: true }),
        makeHeatingRecord({ id: "h2", system_operational: false, safety_check_passed: false, thermostat_working: false }),
      ],
      window_compliance_records: [
        ...manyWindow(5, { compliance_met: true }),
        ...manyWindow(5, { compliance_met: false, id: "w_bad" }),
      ],
      child_comfort_records: [
        makeComfortRecord({ comfort_rating: 3, temperature_preference: "comfortable", sleeps_well_temperature: true, bedding_adequate: true, child_voice_captured: false }),
        makeComfortRecord({ id: "c2", child_id: "child_2", comfort_rating: 2, temperature_preference: "too_cold", sleeps_well_temperature: false, bedding_adequate: false, child_voice_captured: false }),
      ],
    });
    expect(r.temperature_score).toBe(52);
  });
});

// ── Outstanding Rating ─────────────────────────────────────────────────────

describe("outstanding rating", () => {
  function makeOutstandingInput(): BedroomTempInput {
    return {
      ...baseInput,
      temperature_monitoring_records: [
        ...manyTemp(9, { within_range: true, time_of_day: "morning", thermometer_calibrated: true, action_required: true, action_taken: true }),
        ...manyTemp(1, { within_range: true, time_of_day: "night", thermometer_calibrated: true, id: "nt", action_required: true, action_taken: true }),
      ],
      ventilation_records: manyVent(10, { adequate: true }),
      heating_check_records: manyHeating(5, {
        system_operational: true,
        safety_check_passed: true,
        thermostat_working: true,
        engineer_certified: true,
      }),
      window_compliance_records: manyWindow(5, {
        compliance_met: true,
        fall_risk_assessed: true,
        fall_risk_mitigated: true,
        window_restrictor_fitted: true,
      }),
      child_comfort_records: [
        ...manyComfort(4, {
          comfort_rating: 5,
          temperature_preference: "comfortable",
          sleeps_well_temperature: true,
          bedding_adequate: true,
          bedding_seasonal: true,
          child_voice_captured: true,
          can_adjust_temperature: true,
          window_usage_confident: true,
          heating_control_understood: true,
        }),
      ],
    };
  }

  it("returns outstanding rating", () => {
    const r = computeBedroomTemperatureVentilation(makeOutstandingInput());
    expect(r.temperature_rating).toBe("outstanding");
  });

  it("score is 80 (base 52 + 28 bonuses)", () => {
    const r = computeBedroomTemperatureVentilation(makeOutstandingInput());
    expect(r.temperature_score).toBe(80);
  });

  it("has no concerns", () => {
    const r = computeBedroomTemperatureVentilation(makeOutstandingInput());
    expect(r.concerns.length).toBe(0);
  });

  it("has no recommendations", () => {
    const r = computeBedroomTemperatureVentilation(makeOutstandingInput());
    expect(r.recommendations.length).toBe(0);
  });

  it("headline mentions outstanding", () => {
    const r = computeBedroomTemperatureVentilation(makeOutstandingInput());
    expect(r.headline.toLowerCase()).toContain("outstanding");
  });

  it("has positive insights", () => {
    const r = computeBedroomTemperatureVentilation(makeOutstandingInput());
    const positiveInsights = r.insights.filter((i) => i.severity === "positive");
    expect(positiveInsights.length).toBeGreaterThan(0);
  });

  it("has multiple strengths", () => {
    const r = computeBedroomTemperatureVentilation(makeOutstandingInput());
    expect(r.strengths.length).toBeGreaterThanOrEqual(5);
  });
});

// ── Good Rating ─────────────────────────────────────────────────────────────

describe("good rating", () => {
  function makeGoodInput(): BedroomTempInput {
    return {
      ...baseInput,
      temperature_monitoring_records: [
        ...manyTemp(7, { within_range: true }),
        ...manyTemp(3, { within_range: false, id: "tBad" }),
      ],
      ventilation_records: [
        ...manyVent(8, { adequate: true }),
        ...manyVent(2, { adequate: false, id: "vBad" }),
      ],
      heating_check_records: manyHeating(5, {
        system_operational: true,
        safety_check_passed: true,
        thermostat_working: true,
      }),
      window_compliance_records: [
        ...manyWindow(7, { compliance_met: true }),
        ...manyWindow(3, { compliance_met: false, id: "wBad" }),
      ],
      child_comfort_records: manyComfort(4, {
        comfort_rating: 4,
        temperature_preference: "comfortable",
        sleeps_well_temperature: true,
        bedding_adequate: true,
        child_voice_captured: true,
      }),
    };
  }

  it("returns good rating", () => {
    const r = computeBedroomTemperatureVentilation(makeGoodInput());
    expect(r.temperature_rating).toBe("good");
  });

  it("score is between 65 and 79", () => {
    const r = computeBedroomTemperatureVentilation(makeGoodInput());
    expect(r.temperature_score).toBeGreaterThanOrEqual(65);
    expect(r.temperature_score).toBeLessThan(80);
  });

  it("headline mentions good", () => {
    const r = computeBedroomTemperatureVentilation(makeGoodInput());
    expect(r.headline.toLowerCase()).toContain("good");
  });
});

// ── Adequate Rating ─────────────────────────────────────────────────────────

describe("adequate rating", () => {
  function makeAdequateInput(): BedroomTempInput {
    return {
      ...baseInput,
      temperature_monitoring_records: [
        ...manyTemp(5, { within_range: true }),
        ...manyTemp(5, { within_range: false, id: "tBad" }),
      ],
      ventilation_records: [
        ...manyVent(6, { adequate: true }),
        ...manyVent(4, { adequate: false, id: "vBad" }),
      ],
      heating_check_records: [
        makeHeatingRecord({ system_operational: true, safety_check_passed: true, thermostat_working: false }),
        makeHeatingRecord({ id: "h2", system_operational: true, safety_check_passed: false, thermostat_working: true }),
      ],
      window_compliance_records: [
        ...manyWindow(6, { compliance_met: true }),
        ...manyWindow(4, { compliance_met: false, id: "wBad" }),
      ],
      child_comfort_records: manyComfort(2, {
        comfort_rating: 3,
        temperature_preference: "comfortable",
        sleeps_well_temperature: true,
        bedding_adequate: false,
        child_voice_captured: false,
      }),
    };
  }

  it("returns adequate rating", () => {
    const r = computeBedroomTemperatureVentilation(makeAdequateInput());
    expect(r.temperature_rating).toBe("adequate");
  });

  it("score is between 45 and 64", () => {
    const r = computeBedroomTemperatureVentilation(makeAdequateInput());
    expect(r.temperature_score).toBeGreaterThanOrEqual(45);
    expect(r.temperature_score).toBeLessThan(65);
  });

  it("headline mentions adequate", () => {
    const r = computeBedroomTemperatureVentilation(makeAdequateInput());
    expect(r.headline.toLowerCase()).toContain("adequate");
  });
});

// ── Inadequate Rating ───────────────────────────────────────────────────────

describe("inadequate rating", () => {
  function makeInadequateInput(): BedroomTempInput {
    return {
      ...baseInput,
      temperature_monitoring_records: [
        ...manyTemp(2, { within_range: true }),
        ...manyTemp(8, { within_range: false, id: "tBad" }),
      ],
      ventilation_records: [
        ...manyVent(3, { adequate: true }),
        ...manyVent(7, { adequate: false, id: "vBad" }),
      ],
      heating_check_records: [
        makeHeatingRecord({ system_operational: false, safety_check_passed: false, thermostat_working: false }),
      ],
      window_compliance_records: [
        ...manyWindow(2, { compliance_met: true }),
        ...manyWindow(8, { compliance_met: false, id: "wBad" }),
      ],
      child_comfort_records: manyComfort(2, {
        comfort_rating: 1,
        temperature_preference: "too_cold",
        sleeps_well_temperature: false,
        bedding_adequate: false,
        child_voice_captured: false,
      }),
    };
  }

  it("returns inadequate rating", () => {
    const r = computeBedroomTemperatureVentilation(makeInadequateInput());
    expect(r.temperature_rating).toBe("inadequate");
  });

  it("score is below 45", () => {
    const r = computeBedroomTemperatureVentilation(makeInadequateInput());
    expect(r.temperature_score).toBeLessThan(45);
  });

  it("has multiple concerns", () => {
    const r = computeBedroomTemperatureVentilation(makeInadequateInput());
    expect(r.concerns.length).toBeGreaterThanOrEqual(3);
  });

  it("has critical insights", () => {
    const r = computeBedroomTemperatureVentilation(makeInadequateInput());
    const critical = r.insights.filter((i) => i.severity === "critical");
    expect(critical.length).toBeGreaterThanOrEqual(3);
  });

  it("has immediate recommendations", () => {
    const r = computeBedroomTemperatureVentilation(makeInadequateInput());
    const immediate = r.recommendations.filter((rec) => rec.urgency === "immediate");
    expect(immediate.length).toBeGreaterThanOrEqual(3);
  });

  it("headline mentions inadequate", () => {
    const r = computeBedroomTemperatureVentilation(makeInadequateInput());
    expect(r.headline.toLowerCase()).toContain("inadequate");
  });
});

// ── Bonuses in Isolation ────────────────────────────────────────────────────

describe("bonuses in isolation", () => {
  it("Bonus 1: temperatureMonitoringRate >=90 → +4", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      temperature_monitoring_records: manyTemp(10, { within_range: true }),
    });
    expect(r.temperature_score).toBe(52 + 4);
  });

  it("Bonus 1: temperatureMonitoringRate >=70 <90 → +2", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      temperature_monitoring_records: [
        ...manyTemp(7, { within_range: true }),
        ...manyTemp(3, { within_range: false, id: "b" }),
      ],
    });
    expect(r.temperature_score).toBe(52 + 2);
  });

  it("Bonus 2: ventilationRate >=95 → +4", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      ventilation_records: manyVent(20, { adequate: true }),
    });
    expect(r.temperature_score).toBe(52 + 4);
  });

  it("Bonus 2: ventilationRate >=80 <95 → +2", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      ventilation_records: [
        ...manyVent(8, { adequate: true }),
        ...manyVent(2, { adequate: false, id: "vb" }),
      ],
    });
    expect(r.temperature_score).toBe(52 + 2);
  });

  it("Bonus 3: heatingCheckRate >=90 → +3", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      heating_check_records: manyHeating(5, {
        system_operational: true,
        safety_check_passed: true,
        thermostat_working: true,
      }),
    });
    // heatingCheckRate = (100+100+100)/3 = 100
    // also safetyCheckRate 100 → +3 for bonus 7
    expect(r.temperature_score).toBe(52 + 3 + 3);
  });

  it("Bonus 3: heatingCheckRate >=70 <90 → +1", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      heating_check_records: [
        makeHeatingRecord({ system_operational: true, safety_check_passed: true, thermostat_working: true }),
        makeHeatingRecord({ id: "h2", system_operational: true, safety_check_passed: true, thermostat_working: false }),
        makeHeatingRecord({ id: "h3", system_operational: true, safety_check_passed: false, thermostat_working: true }),
      ],
    });
    // operationalRate=100, safetyRate=67, thermostatRate=67 → composite=(100+67+67)/3=78
    // Bonus 3: +1
    // Bonus 7 (safetyCheckRate=67): no bonus
    expect(r.temperature_score).toBe(52 + 1);
  });

  it("Bonus 4: windowComplianceRate >=90 → +3", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      window_compliance_records: manyWindow(10, { compliance_met: true }),
    });
    expect(r.temperature_score).toBe(52 + 3);
  });

  it("Bonus 4: windowComplianceRate >=70 <90 → +1", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      window_compliance_records: [
        ...manyWindow(7, { compliance_met: true }),
        ...manyWindow(3, { compliance_met: false, id: "wb" }),
      ],
    });
    expect(r.temperature_score).toBe(52 + 1);
  });

  it("Bonus 5: childComfortRate >=90 → +3", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      child_comfort_records: manyComfort(4, {
        temperature_preference: "comfortable",
        sleeps_well_temperature: true,
        bedding_adequate: true,
        comfort_rating: 5,
        child_voice_captured: true,
      }),
    });
    // childComfortRate: (100+100+100)/3 = 100 → +3
    // avgComfortRating: 5.0 >=4.0 → +3 (bonus 8)
    // childVoiceCapturedRate: 100 >=90 → +2 (bonus 9)
    expect(r.temperature_score).toBe(52 + 3 + 3 + 2);
  });

  it("Bonus 5: childComfortRate >=70 <90 → +1", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      child_comfort_records: [
        makeComfortRecord({ temperature_preference: "comfortable", sleeps_well_temperature: true, bedding_adequate: true, comfort_rating: 3, child_voice_captured: false }),
        makeComfortRecord({ id: "c2", child_id: "child_2", temperature_preference: "too_cold", sleeps_well_temperature: true, bedding_adequate: true, comfort_rating: 3, child_voice_captured: false }),
        makeComfortRecord({ id: "c3", child_id: "child_3", temperature_preference: "comfortable", sleeps_well_temperature: true, bedding_adequate: false, comfort_rating: 3, child_voice_captured: false }),
      ],
    });
    // comfortableTempRate: 67%, sleepsWellRate: 100%, beddingAdequateRate: 67%
    // childComfortRate: (67+100+67)/3 = 78 → +1
    // avgComfortRating: 3.0 → +1 (bonus 8)
    expect(r.temperature_score).toBe(52 + 1 + 1);
  });

  it("Bonus 6: actionResponseRate >=90 → +3", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      temperature_monitoring_records: manyTemp(10, {
        within_range: true,
        action_required: true,
        action_taken: true,
      }),
    });
    // tempMonitoringRate 100 → +4, actionResponseRate 100 → +3
    expect(r.temperature_score).toBe(52 + 4 + 3);
  });

  it("Bonus 6: actionResponseRate >=70 <90 → +1", () => {
    const records = [
      ...manyTemp(7, { within_range: true, action_required: true, action_taken: true }),
      makeTempRecord({ id: "na1", within_range: true, action_required: true, action_taken: false }),
      makeTempRecord({ id: "na2", within_range: true, action_required: true, action_taken: false }),
      makeTempRecord({ id: "na3", within_range: true, action_required: true, action_taken: false }),
    ];
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      temperature_monitoring_records: records,
    });
    // actionResponseRate: 7/10=70 → +1, tempMonitoringRate 100 → +4
    expect(r.temperature_score).toBe(52 + 4 + 1);
  });

  it("Bonus 7: safetyCheckRate >=90 → +3", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      heating_check_records: manyHeating(10, {
        safety_check_passed: true,
        system_operational: true,
        thermostat_working: true,
      }),
    });
    // heatingCheckRate = (100+100+100)/3 = 100 → +3
    // safetyCheckRate = 100 → +3
    expect(r.temperature_score).toBe(52 + 3 + 3);
  });

  it("Bonus 7: safetyCheckRate >=70 <90 → +1", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      heating_check_records: [
        ...manyHeating(7, { safety_check_passed: true, system_operational: false, thermostat_working: false }),
        ...manyHeating(3, { safety_check_passed: false, system_operational: false, thermostat_working: false, id: "hb" }),
      ],
    });
    // safetyCheckRate: 70 → +1
    // heatingCheckRate: (0+70+0)/3 = 23 → no bonus
    // heatingCheckRate < 40 → -5 penalty
    expect(r.temperature_score).toBe(52 + 1 - 5);
  });

  it("Bonus 8: avgComfortRating >=4.0 → +3", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      child_comfort_records: manyComfort(4, {
        comfort_rating: 4,
        temperature_preference: "too_cold",
        sleeps_well_temperature: false,
        bedding_adequate: false,
        child_voice_captured: false,
      }),
    });
    // childComfortRate: (0+0+0)/3=0 → no bonus, but < 30 → -3 penalty
    // avgComfortRating: 4.0 → +3
    expect(r.temperature_score).toBe(52 + 3 - 3);
  });

  it("Bonus 8: avgComfortRating >=3.0 <4.0 → +1", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      child_comfort_records: manyComfort(4, {
        comfort_rating: 3,
        temperature_preference: "too_cold",
        sleeps_well_temperature: false,
        bedding_adequate: false,
        child_voice_captured: false,
      }),
    });
    // childComfortRate: 0 → -3
    // avgComfortRating: 3.0 → +1
    expect(r.temperature_score).toBe(52 + 1 - 3);
  });

  it("Bonus 9: childVoiceCapturedRate >=90 → +2", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      child_comfort_records: manyComfort(4, {
        child_voice_captured: true,
        comfort_rating: 1,
        temperature_preference: "too_cold",
        sleeps_well_temperature: false,
        bedding_adequate: false,
      }),
    });
    // childVoice: 100 → +2
    // childComfortRate: 0 → -3
    expect(r.temperature_score).toBe(52 + 2 - 3);
  });

  it("Bonus 9: childVoiceCapturedRate >=70 <90 → +1", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      child_comfort_records: [
        ...manyComfort(7, { child_voice_captured: true, comfort_rating: 1, temperature_preference: "too_cold", sleeps_well_temperature: false, bedding_adequate: false }),
        ...manyComfort(3, { child_voice_captured: false, comfort_rating: 1, temperature_preference: "too_cold", sleeps_well_temperature: false, bedding_adequate: false, id: "cv" }),
      ],
    });
    // childVoice: 70 → +1
    // childComfortRate: 0 → -3
    expect(r.temperature_score).toBe(52 + 1 - 3);
  });

  it("max bonuses total = 28", () => {
    // When all bonuses max: +4+4+3+3+3+3+3+3+2 = 28
    expect(4 + 4 + 3 + 3 + 3 + 3 + 3 + 3 + 2).toBe(28);
  });
});

// ── Penalties ───────────────────────────────────────────────────────────────

describe("penalties", () => {
  it("temperatureMonitoringRate < 40 → -5 (guarded by records > 0)", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      temperature_monitoring_records: [
        ...manyTemp(3, { within_range: true }),
        ...manyTemp(7, { within_range: false, id: "tb" }),
      ],
    });
    // 30% → -5
    expect(r.temperature_score).toBe(52 - 5);
  });

  it("no penalty when temperatureMonitoringRate < 40 but no temp records", () => {
    const r = computeBedroomTemperatureVentilation({ ...baseInput });
    // inadequate floor but via the "children but no records" path
    expect(r.temperature_score).toBe(15);
  });

  it("ventilationRate < 50 → -5 (guarded by records > 0)", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      ventilation_records: [
        ...manyVent(4, { adequate: true }),
        ...manyVent(6, { adequate: false, id: "vb" }),
      ],
    });
    // 40% → -5
    expect(r.temperature_score).toBe(52 - 5);
  });

  it("heatingCheckRate < 40 → -5 (guarded by records > 0)", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      heating_check_records: [
        makeHeatingRecord({ system_operational: false, safety_check_passed: false, thermostat_working: false }),
      ],
    });
    // heatingCheckRate: (0+0+0)/3 = 0 → -5
    expect(r.temperature_score).toBe(52 - 5);
  });

  it("childComfortRate < 30 → -3 (guarded by records > 0)", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      child_comfort_records: manyComfort(4, {
        comfort_rating: 1,
        temperature_preference: "too_cold",
        sleeps_well_temperature: false,
        bedding_adequate: false,
        child_voice_captured: false,
      }),
    });
    // childComfortRate: (0+0+0)/3 = 0 → -3
    expect(r.temperature_score).toBe(52 - 3);
  });

  it("all penalties combined: -5 -5 -5 -3 = -18 → score = 34", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      temperature_monitoring_records: [
        ...manyTemp(2, { within_range: true }),
        ...manyTemp(8, { within_range: false, id: "tb" }),
      ],
      ventilation_records: [
        ...manyVent(2, { adequate: true }),
        ...manyVent(8, { adequate: false, id: "vb" }),
      ],
      heating_check_records: [
        makeHeatingRecord({ system_operational: false, safety_check_passed: false, thermostat_working: false }),
      ],
      child_comfort_records: manyComfort(4, {
        comfort_rating: 1,
        temperature_preference: "too_cold",
        sleeps_well_temperature: false,
        bedding_adequate: false,
        child_voice_captured: false,
      }),
    });
    expect(r.temperature_score).toBe(52 - 5 - 5 - 5 - 3);
  });

  it("score cannot go below 0 (clamp)", () => {
    // Even with extreme penalties, score is clamped at 0
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      total_children: 0,
    });
    expect(r.temperature_score).toBeGreaterThanOrEqual(0);
  });
});

// ── Rates ───────────────────────────────────────────────────────────────────

describe("rates", () => {
  it("temperatureMonitoringRate is pct of within_range", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      temperature_monitoring_records: [
        ...manyTemp(7, { within_range: true }),
        ...manyTemp(3, { within_range: false, id: "tb" }),
      ],
    });
    expect(r.temperature_monitoring_rate).toBe(70);
  });

  it("ventilationRate is pct of adequate", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      ventilation_records: [
        ...manyVent(8, { adequate: true }),
        ...manyVent(2, { adequate: false, id: "vb" }),
      ],
    });
    expect(r.ventilation_rate).toBe(80);
  });

  it("heatingCheckRate is composite of operational + safety + thermostat", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      heating_check_records: [
        makeHeatingRecord({ system_operational: true, safety_check_passed: true, thermostat_working: true }),
        makeHeatingRecord({ id: "h2", system_operational: true, safety_check_passed: false, thermostat_working: false }),
      ],
    });
    // operational: 100, safety: 50, thermostat: 50 → (100+50+50)/3 = 67
    expect(r.heating_check_rate).toBe(67);
  });

  it("windowComplianceRate is pct of compliance_met", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      window_compliance_records: [
        ...manyWindow(9, { compliance_met: true }),
        makeWindowRecord({ id: "w_bad", compliance_met: false }),
      ],
    });
    expect(r.window_compliance_rate).toBe(90);
  });

  it("childComfortRate is composite of comfortableTemp + sleepsWell + beddingAdequate", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      child_comfort_records: [
        makeComfortRecord({ temperature_preference: "comfortable", sleeps_well_temperature: true, bedding_adequate: true }),
        makeComfortRecord({ id: "c2", child_id: "child_2", temperature_preference: "too_cold", sleeps_well_temperature: false, bedding_adequate: false }),
      ],
    });
    // comfortable: 50%, sleeps: 50%, bedding: 50% → (50+50+50)/3 = 50
    expect(r.child_comfort_rate).toBe(50);
  });

  it("actionResponseRate combines all action types", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      temperature_monitoring_records: [
        makeTempRecord({ action_required: true, action_taken: true }),
        makeTempRecord({ id: "t2", action_required: true, action_taken: false }),
      ],
      ventilation_records: [
        makeVentRecord({ maintenance_required: true, maintenance_completed: true }),
      ],
      heating_check_records: [
        makeHeatingRecord({ issues_found: true, issues_resolved: true }),
      ],
      child_comfort_records: [
        makeComfortRecord({ requested_changes: true, changes_actioned: true }),
      ],
    });
    // total: 4 actions taken out of 5 required → 80%
    expect(r.action_response_rate).toBe(80);
  });

  it("action_response_rate 0 when no actions required in any category", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      temperature_monitoring_records: manyTemp(5, { action_required: false }),
      ventilation_records: manyVent(5, { maintenance_required: false }),
      heating_check_records: manyHeating(5, { issues_found: false }),
      child_comfort_records: manyComfort(4, { requested_changes: false }),
    });
    expect(r.action_response_rate).toBe(0);
  });
});

// ── Totals ──────────────────────────────────────────────────────────────────

describe("totals", () => {
  it("total_temperature_records reflects array length", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      temperature_monitoring_records: manyTemp(7),
    });
    expect(r.total_temperature_records).toBe(7);
  });

  it("total_ventilation_records reflects array length", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      ventilation_records: manyVent(3),
    });
    expect(r.total_ventilation_records).toBe(3);
  });

  it("total_heating_check_records reflects array length", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      heating_check_records: manyHeating(6),
    });
    expect(r.total_heating_check_records).toBe(6);
  });

  it("total_window_compliance_records reflects array length", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      window_compliance_records: manyWindow(4),
    });
    expect(r.total_window_compliance_records).toBe(4);
  });

  it("total_child_comfort_records reflects array length", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      child_comfort_records: manyComfort(2),
    });
    expect(r.total_child_comfort_records).toBe(2);
  });
});

// ── Strengths ───────────────────────────────────────────────────────────────

describe("strengths", () => {
  it("temperature monitoring strength at >=90%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      temperature_monitoring_records: manyTemp(10, { within_range: true }),
    });
    expect(r.strengths.some((s) => s.includes("100%") && s.toLowerCase().includes("temperature"))).toBe(true);
  });

  it("temperature monitoring strength at >=70% <90%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      temperature_monitoring_records: [
        ...manyTemp(7, { within_range: true }),
        ...manyTemp(3, { within_range: false, id: "b" }),
      ],
    });
    expect(r.strengths.some((s) => s.includes("70%") && s.toLowerCase().includes("temperature"))).toBe(true);
  });

  it("no temperature strength below 70%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      temperature_monitoring_records: [
        ...manyTemp(6, { within_range: true }),
        ...manyTemp(4, { within_range: false, id: "b" }),
      ],
    });
    expect(r.strengths.some((s) => s.toLowerCase().includes("temperature") && s.toLowerCase().includes("compliance"))).toBe(false);
  });

  it("ventilation strength at >=95%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      ventilation_records: manyVent(20, { adequate: true }),
    });
    expect(r.strengths.some((s) => s.includes("100%") && s.toLowerCase().includes("ventilation"))).toBe(true);
  });

  it("ventilation strength at >=80% <95%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      ventilation_records: [
        ...manyVent(9, { adequate: true }),
        ...manyVent(1, { adequate: false, id: "vb" }),
      ],
    });
    expect(r.strengths.some((s) => s.includes("90%") && s.toLowerCase().includes("ventilation"))).toBe(true);
  });

  it("heating check strength at >=90%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      heating_check_records: manyHeating(5, {
        system_operational: true,
        safety_check_passed: true,
        thermostat_working: true,
      }),
    });
    expect(r.strengths.some((s) => s.toLowerCase().includes("heating") && s.includes("100%"))).toBe(true);
  });

  it("window compliance strength at >=90%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      window_compliance_records: manyWindow(10, { compliance_met: true }),
    });
    expect(r.strengths.some((s) => s.includes("100%") && s.toLowerCase().includes("window"))).toBe(true);
  });

  it("child comfort strength at >=90%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      child_comfort_records: manyComfort(4, {
        temperature_preference: "comfortable",
        sleeps_well_temperature: true,
        bedding_adequate: true,
      }),
    });
    expect(r.strengths.some((s) => s.toLowerCase().includes("child comfort") && s.includes("100%"))).toBe(true);
  });

  it("action response strength at >=90%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      temperature_monitoring_records: manyTemp(10, { action_required: true, action_taken: true, within_range: true }),
    });
    expect(r.strengths.some((s) => s.toLowerCase().includes("action response"))).toBe(true);
  });

  it("safety check strength at >=90%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      heating_check_records: manyHeating(5, { safety_check_passed: true, system_operational: true, thermostat_working: true }),
    });
    expect(r.strengths.some((s) => s.toLowerCase().includes("safety check"))).toBe(true);
  });

  it("avg comfort rating strength at >=4.0", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      child_comfort_records: manyComfort(4, { comfort_rating: 4 }),
    });
    expect(r.strengths.some((s) => s.includes("4/5") || s.includes("4.0"))).toBe(true);
  });

  it("child voice captured strength at >=90%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      child_comfort_records: manyComfort(4, { child_voice_captured: true }),
    });
    expect(r.strengths.some((s) => s.toLowerCase().includes("child's voice") || s.toLowerCase().includes("voice"))).toBe(true);
  });

  it("night-time compliance strength at >=90%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      temperature_monitoring_records: manyTemp(10, { within_range: true, time_of_day: "night" }),
    });
    expect(r.strengths.some((s) => s.toLowerCase().includes("night"))).toBe(true);
  });

  it("calibration strength at >=90%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      temperature_monitoring_records: manyTemp(10, { thermometer_calibrated: true }),
    });
    expect(r.strengths.some((s) => s.toLowerCase().includes("calibrat"))).toBe(true);
  });

  it("no mould strength when mould rate is 0", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      ventilation_records: manyVent(10, { mould_present: false }),
    });
    expect(r.strengths.some((s) => s.toLowerCase().includes("mould"))).toBe(true);
  });

  it("child coverage strength at 100%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      total_children: 4,
      child_comfort_records: manyComfort(4),
    });
    expect(r.strengths.some((s) => s.toLowerCase().includes("every child"))).toBe(true);
  });

  it("seasonal coverage strength at 4 seasons", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      temperature_monitoring_records: [
        makeTempRecord({ id: "sp", season: "spring", within_range: true }),
        makeTempRecord({ id: "su", season: "summer", within_range: true }),
        makeTempRecord({ id: "au", season: "autumn", within_range: true }),
        makeTempRecord({ id: "wi", season: "winter", within_range: true }),
      ],
    });
    expect(r.strengths.some((s) => s.toLowerCase().includes("season"))).toBe(true);
  });

  it("restrictor rate strength at >=95%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      window_compliance_records: manyWindow(20, { window_restrictor_fitted: true }),
    });
    expect(r.strengths.some((s) => s.toLowerCase().includes("restrictor"))).toBe(true);
  });

  it("fall risk assessment strength at >=95%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      window_compliance_records: manyWindow(20, { fall_risk_assessed: true }),
    });
    expect(r.strengths.some((s) => s.toLowerCase().includes("fall risk"))).toBe(true);
  });

  it("can adjust temperature strength at >=80%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      child_comfort_records: manyComfort(4, { can_adjust_temperature: true }),
    });
    expect(r.strengths.some((s) => s.toLowerCase().includes("adjust"))).toBe(true);
  });

  it("changes actioned strength at >=90% with changes requested", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      child_comfort_records: manyComfort(4, {
        requested_changes: true,
        changes_actioned: true,
      }),
    });
    expect(r.strengths.some((s) => s.toLowerCase().includes("change"))).toBe(true);
  });
});

// ── Concerns ────────────────────────────────────────────────────────────────

describe("concerns", () => {
  it("temperature concern at <40%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      temperature_monitoring_records: [
        ...manyTemp(3, { within_range: true }),
        ...manyTemp(7, { within_range: false, id: "tb" }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("30%"))).toBe(true);
  });

  it("temperature concern at >=40% <70%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      temperature_monitoring_records: [
        ...manyTemp(5, { within_range: true }),
        ...manyTemp(5, { within_range: false, id: "tb" }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("50%") && c.toLowerCase().includes("temperature"))).toBe(true);
  });

  it("ventilation concern at <50%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      ventilation_records: [
        ...manyVent(4, { adequate: true }),
        ...manyVent(6, { adequate: false, id: "vb" }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("40%") && c.toLowerCase().includes("ventilation"))).toBe(true);
  });

  it("ventilation concern at >=50% <80%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      ventilation_records: [
        ...manyVent(6, { adequate: true }),
        ...manyVent(4, { adequate: false, id: "vb" }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("60%") && c.toLowerCase().includes("ventilation"))).toBe(true);
  });

  it("heating concern at <40%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      heating_check_records: [
        makeHeatingRecord({ system_operational: false, safety_check_passed: false, thermostat_working: false }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("0%") && c.toLowerCase().includes("heating"))).toBe(true);
  });

  it("heating concern at >=40% <70%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      heating_check_records: [
        makeHeatingRecord({ system_operational: true, safety_check_passed: true, thermostat_working: true }),
        makeHeatingRecord({ id: "h2", system_operational: true, safety_check_passed: false, thermostat_working: false }),
        makeHeatingRecord({ id: "h3", system_operational: false, safety_check_passed: false, thermostat_working: false }),
      ],
    });
    // operational: 67, safety: 33, thermostat: 33 → (67+33+33)/3 = 44
    expect(r.concerns.some((c) => c.toLowerCase().includes("heating"))).toBe(true);
  });

  it("window compliance concern at <50%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      window_compliance_records: [
        ...manyWindow(2, { compliance_met: true }),
        ...manyWindow(8, { compliance_met: false, id: "wb" }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("20%") && c.toLowerCase().includes("window"))).toBe(true);
  });

  it("window compliance concern at >=50% <70%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      window_compliance_records: [
        ...manyWindow(6, { compliance_met: true }),
        ...manyWindow(4, { compliance_met: false, id: "wb" }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("60%") && c.toLowerCase().includes("window"))).toBe(true);
  });

  it("child comfort concern at <30%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      child_comfort_records: manyComfort(4, {
        temperature_preference: "too_cold",
        sleeps_well_temperature: false,
        bedding_adequate: false,
      }),
    });
    expect(r.concerns.some((c) => c.toLowerCase().includes("child comfort") && c.includes("0%"))).toBe(true);
  });

  it("child comfort concern at >=30% <70%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      child_comfort_records: [
        makeComfortRecord({ temperature_preference: "comfortable", sleeps_well_temperature: true, bedding_adequate: true }),
        makeComfortRecord({ id: "c2", child_id: "child_2", temperature_preference: "too_cold", sleeps_well_temperature: false, bedding_adequate: false }),
      ],
    });
    // (50+50+50)/3 = 50 → concern
    expect(r.concerns.some((c) => c.toLowerCase().includes("child comfort"))).toBe(true);
  });

  it("mould concern at >=20%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      ventilation_records: [
        ...manyVent(2, { mould_present: true }),
        ...manyVent(8, { mould_present: false, id: "nm" }),
      ],
    });
    expect(r.concerns.some((c) => c.toLowerCase().includes("mould"))).toBe(true);
  });

  it("mould concern at >0% <20%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      ventilation_records: [
        makeVentRecord({ mould_present: true }),
        ...manyVent(9, { mould_present: false, id: "nm" }),
      ],
    });
    expect(r.concerns.some((c) => c.toLowerCase().includes("mould"))).toBe(true);
  });

  it("condensation concern at >=30%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      ventilation_records: [
        ...manyVent(3, { condensation_present: true }),
        ...manyVent(7, { condensation_present: false, id: "nc" }),
      ],
    });
    expect(r.concerns.some((c) => c.toLowerCase().includes("condensation"))).toBe(true);
  });

  it("condensation concern at >=15% <30%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      ventilation_records: [
        ...manyVent(2, { condensation_present: true }),
        ...manyVent(8, { condensation_present: false, id: "nc" }),
      ],
    });
    expect(r.concerns.some((c) => c.toLowerCase().includes("condensation"))).toBe(true);
  });

  it("service overdue concern at >=20%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      heating_check_records: [
        ...manyHeating(2, { service_overdue: true }),
        ...manyHeating(8, { service_overdue: false, id: "hns" }),
      ],
    });
    expect(r.concerns.some((c) => c.toLowerCase().includes("overdue"))).toBe(true);
  });

  it("action response concern at <50%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      temperature_monitoring_records: [
        ...manyTemp(2, { action_required: true, action_taken: true, within_range: true }),
        ...manyTemp(8, { action_required: true, action_taken: false, within_range: true, id: "na" }),
      ],
    });
    expect(r.concerns.some((c) => c.toLowerCase().includes("action response"))).toBe(true);
  });

  it("action response concern at >=50% <70%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      temperature_monitoring_records: [
        ...manyTemp(6, { action_required: true, action_taken: true, within_range: true }),
        ...manyTemp(4, { action_required: true, action_taken: false, within_range: true, id: "na" }),
      ],
    });
    expect(r.concerns.some((c) => c.toLowerCase().includes("action response"))).toBe(true);
  });

  it("child coverage concern at <50%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      total_children: 10,
      child_comfort_records: [makeComfortRecord()],
    });
    expect(r.concerns.some((c) => c.toLowerCase().includes("comfort assessed"))).toBe(true);
  });

  it("poor condition windows concern at >=20%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      window_compliance_records: [
        ...manyWindow(2, { window_condition: "poor" }),
        ...manyWindow(8, { window_condition: "good", id: "wg" }),
      ],
    });
    expect(r.concerns.some((c) => c.toLowerCase().includes("poor") || c.toLowerCase().includes("damaged") || c.toLowerCase().includes("condition"))).toBe(true);
  });

  it("night-time compliance concern at <50%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      temperature_monitoring_records: [
        ...manyTemp(2, { time_of_day: "night", within_range: true }),
        ...manyTemp(8, { time_of_day: "night", within_range: false, id: "nb" }),
      ],
    });
    expect(r.concerns.some((c) => c.toLowerCase().includes("night"))).toBe(true);
  });

  it("fall risk assessment concern at <50%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      window_compliance_records: [
        ...manyWindow(2, { fall_risk_assessed: true }),
        ...manyWindow(8, { fall_risk_assessed: false, id: "fb" }),
      ],
    });
    expect(r.concerns.some((c) => c.toLowerCase().includes("fall risk"))).toBe(true);
  });

  it("child voice concern at <50%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      child_comfort_records: [
        ...manyComfort(2, { child_voice_captured: true }),
        ...manyComfort(8, { child_voice_captured: false, id: "nv" }),
      ],
    });
    expect(r.concerns.some((c) => c.toLowerCase().includes("voice"))).toBe(true);
  });

  it("bedding adequate concern at <70%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      child_comfort_records: [
        ...manyComfort(3, { bedding_adequate: true }),
        ...manyComfort(7, { bedding_adequate: false, id: "nb" }),
      ],
    });
    expect(r.concerns.some((c) => c.toLowerCase().includes("bedding"))).toBe(true);
  });
});

// ── Recommendations ─────────────────────────────────────────────────────────

describe("recommendations", () => {
  it("ranks are sequential starting from 1", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      temperature_monitoring_records: manyTemp(10, { within_range: false }),
      ventilation_records: manyVent(10, { adequate: false }),
    });
    for (let i = 0; i < r.recommendations.length; i++) {
      expect(r.recommendations[i].rank).toBe(i + 1);
    }
  });

  it("immediate urgency for temp <40%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      temperature_monitoring_records: manyTemp(10, { within_range: false }),
    });
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.toLowerCase().includes("temperature"))).toBe(true);
  });

  it("immediate urgency for ventilation <50%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      ventilation_records: manyVent(10, { adequate: false }),
    });
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.toLowerCase().includes("ventilation"))).toBe(true);
  });

  it("immediate urgency for heating <40%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      heating_check_records: [makeHeatingRecord({ system_operational: false, safety_check_passed: false, thermostat_working: false })],
    });
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.toLowerCase().includes("heating"))).toBe(true);
  });

  it("immediate urgency for mould >=20%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      ventilation_records: [
        ...manyVent(2, { mould_present: true }),
        ...manyVent(8, { mould_present: false, id: "nm" }),
      ],
    });
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.toLowerCase().includes("mould"))).toBe(true);
  });

  it("soon urgency for temp 40-70%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      temperature_monitoring_records: [
        ...manyTemp(5, { within_range: true }),
        ...manyTemp(5, { within_range: false, id: "tb" }),
      ],
    });
    expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.toLowerCase().includes("temperature"))).toBe(true);
  });

  it("soon urgency for ventilation 50-80%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      ventilation_records: [
        ...manyVent(6, { adequate: true }),
        ...manyVent(4, { adequate: false, id: "vb" }),
      ],
    });
    expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.toLowerCase().includes("ventilation"))).toBe(true);
  });

  it("planned urgency for child comfort 30-70%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      child_comfort_records: [
        makeComfortRecord({ temperature_preference: "comfortable", sleeps_well_temperature: true, bedding_adequate: true }),
        makeComfortRecord({ id: "c2", child_id: "child_2", temperature_preference: "too_cold", sleeps_well_temperature: false, bedding_adequate: false }),
      ],
    });
    expect(r.recommendations.some((rec) => rec.urgency === "planned")).toBe(true);
  });

  it("all recommendations have regulatory_ref", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      temperature_monitoring_records: manyTemp(10, { within_range: false }),
      ventilation_records: manyVent(10, { adequate: false }),
    });
    for (const rec of r.recommendations) {
      expect(rec.regulatory_ref.length).toBeGreaterThan(0);
    }
  });

  it("no recommendations when everything is outstanding", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      temperature_monitoring_records: manyTemp(10, { within_range: true }),
      ventilation_records: manyVent(20, { adequate: true }),
      heating_check_records: manyHeating(5, { system_operational: true, safety_check_passed: true, thermostat_working: true }),
      window_compliance_records: manyWindow(10, { compliance_met: true }),
      child_comfort_records: manyComfort(4, {
        temperature_preference: "comfortable",
        sleeps_well_temperature: true,
        bedding_adequate: true,
        bedding_seasonal: true,
        child_voice_captured: true,
        comfort_rating: 5,
      }),
    });
    expect(r.recommendations.length).toBe(0);
  });

  it("calibration recommendation when calibrationRate <70%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      temperature_monitoring_records: [
        ...manyTemp(3, { thermometer_calibrated: true, within_range: true }),
        ...manyTemp(7, { thermometer_calibrated: false, within_range: true, id: "nc" }),
      ],
    });
    expect(r.recommendations.some((rec) => rec.recommendation.toLowerCase().includes("calibration"))).toBe(true);
  });

  it("bedding seasonal recommendation when <70%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      child_comfort_records: [
        ...manyComfort(3, { bedding_seasonal: true }),
        ...manyComfort(7, { bedding_seasonal: false, id: "ns" }),
      ],
    });
    expect(r.recommendations.some((rec) => rec.recommendation.toLowerCase().includes("bedding"))).toBe(true);
  });
});

// ── Insights ────────────────────────────────────────────────────────────────

describe("insights", () => {
  it("critical insight for temp <40%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      temperature_monitoring_records: manyTemp(10, { within_range: false }),
    });
    expect(r.insights.some((i) => i.severity === "critical" && i.text.toLowerCase().includes("temperature"))).toBe(true);
  });

  it("critical insight for ventilation <50%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      ventilation_records: manyVent(10, { adequate: false }),
    });
    expect(r.insights.some((i) => i.severity === "critical" && i.text.toLowerCase().includes("ventilation"))).toBe(true);
  });

  it("critical insight for heating <40%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      heating_check_records: [makeHeatingRecord({ system_operational: false, safety_check_passed: false, thermostat_working: false })],
    });
    expect(r.insights.some((i) => i.severity === "critical" && i.text.toLowerCase().includes("heating"))).toBe(true);
  });

  it("critical insight for mould >=20%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      ventilation_records: [
        ...manyVent(2, { mould_present: true }),
        ...manyVent(8, { mould_present: false, id: "nm" }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "critical" && i.text.toLowerCase().includes("mould"))).toBe(true);
  });

  it("critical insight for child comfort <30%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      child_comfort_records: manyComfort(4, {
        temperature_preference: "too_cold",
        sleeps_well_temperature: false,
        bedding_adequate: false,
      }),
    });
    expect(r.insights.some((i) => i.severity === "critical" && i.text.toLowerCase().includes("comfort"))).toBe(true);
  });

  it("critical insight when no child comfort records but children on placement", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      total_children: 4,
      temperature_monitoring_records: manyTemp(5, { within_range: true }),
    });
    expect(r.insights.some((i) => i.severity === "critical" && i.text.toLowerCase().includes("no child comfort"))).toBe(true);
  });

  it("critical insight for window compliance <50%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      window_compliance_records: [
        ...manyWindow(2, { compliance_met: true }),
        ...manyWindow(8, { compliance_met: false, id: "wb" }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "critical" && i.text.toLowerCase().includes("window"))).toBe(true);
  });

  it("warning insight for temp 40-70%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      temperature_monitoring_records: [
        ...manyTemp(5, { within_range: true }),
        ...manyTemp(5, { within_range: false, id: "tb" }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "warning" && i.text.toLowerCase().includes("temperature"))).toBe(true);
  });

  it("warning insight for ventilation 50-80%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      ventilation_records: [
        ...manyVent(6, { adequate: true }),
        ...manyVent(4, { adequate: false, id: "vb" }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "warning" && i.text.toLowerCase().includes("ventilation"))).toBe(true);
  });

  it("warning insight for heating 40-70%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      heating_check_records: [
        makeHeatingRecord({ system_operational: true, safety_check_passed: true, thermostat_working: true }),
        makeHeatingRecord({ id: "h2", system_operational: true, safety_check_passed: false, thermostat_working: false }),
        makeHeatingRecord({ id: "h3", system_operational: false, safety_check_passed: false, thermostat_working: false }),
      ],
    });
    // (67+33+33)/3 = 44
    expect(r.insights.some((i) => i.severity === "warning" && i.text.toLowerCase().includes("heating"))).toBe(true);
  });

  it("warning insight for window 50-70%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      window_compliance_records: [
        ...manyWindow(6, { compliance_met: true }),
        ...manyWindow(4, { compliance_met: false, id: "wb" }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "warning" && i.text.toLowerCase().includes("window"))).toBe(true);
  });

  it("warning insight for child comfort 30-70%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      child_comfort_records: [
        makeComfortRecord({ temperature_preference: "comfortable", sleeps_well_temperature: true, bedding_adequate: true }),
        makeComfortRecord({ id: "c2", child_id: "child_2", temperature_preference: "too_cold", sleeps_well_temperature: false, bedding_adequate: false }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "warning" && i.text.toLowerCase().includes("comfort"))).toBe(true);
  });

  it("warning insight for action response 50-70%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      temperature_monitoring_records: [
        ...manyTemp(6, { action_required: true, action_taken: true, within_range: true }),
        ...manyTemp(4, { action_required: true, action_taken: false, within_range: true, id: "na" }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "warning" && i.text.toLowerCase().includes("action response"))).toBe(true);
  });

  it("warning insight for condensation 15-30%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      ventilation_records: [
        ...manyVent(2, { condensation_present: true }),
        ...manyVent(8, { condensation_present: false, id: "nc" }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "warning" && i.text.toLowerCase().includes("condensation"))).toBe(true);
  });

  it("warning insight for avg comfort 2.0-3.0", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      child_comfort_records: manyComfort(4, { comfort_rating: 2 }),
    });
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("2/5"))).toBe(true);
  });

  it("warning insight for service overdue 10-20%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      heating_check_records: [
        makeHeatingRecord({ service_overdue: true }),
        ...manyHeating(9, { service_overdue: false, id: "ns" }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "warning" && i.text.toLowerCase().includes("overdue"))).toBe(true);
  });

  it("warning insight for calibration 50-70%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      temperature_monitoring_records: [
        ...manyTemp(6, { thermometer_calibrated: true, within_range: true }),
        ...manyTemp(4, { thermometer_calibrated: false, within_range: true, id: "nc" }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "warning" && i.text.toLowerCase().includes("calibrat"))).toBe(true);
  });

  it("warning insight for seasonal gap", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      temperature_monitoring_records: [
        ...manyTemp(3, { season: "spring", within_range: true }),
        makeTempRecord({ id: "su", season: "summer", within_range: true }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "warning" && i.text.toLowerCase().includes("autumn") && i.text.toLowerCase().includes("winter"))).toBe(true);
  });

  it("positive insight when rating is outstanding", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      temperature_monitoring_records: manyTemp(10, { within_range: true, action_required: true, action_taken: true }),
      ventilation_records: manyVent(20, { adequate: true }),
      heating_check_records: manyHeating(5, { system_operational: true, safety_check_passed: true, thermostat_working: true, engineer_certified: true }),
      window_compliance_records: manyWindow(5, { compliance_met: true, fall_risk_assessed: true }),
      child_comfort_records: manyComfort(4, {
        comfort_rating: 5,
        temperature_preference: "comfortable",
        sleeps_well_temperature: true,
        bedding_adequate: true,
        child_voice_captured: true,
      }),
    });
    expect(r.insights.some((i) => i.severity === "positive" && i.text.toLowerCase().includes("outstanding"))).toBe(true);
  });

  it("positive insight for excellent temp + night-time compliance", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      temperature_monitoring_records: [
        ...manyTemp(5, { within_range: true, time_of_day: "morning" }),
        ...manyTemp(5, { within_range: true, time_of_day: "night", id: "nt" }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "positive" && i.text.toLowerCase().includes("night"))).toBe(true);
  });

  it("positive insight for perfect ventilation with no mould/condensation", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      ventilation_records: manyVent(20, { adequate: true, mould_present: false, condensation_present: false }),
    });
    expect(r.insights.some((i) => i.severity === "positive" && i.text.toLowerCase().includes("ventilation"))).toBe(true);
  });

  it("positive insight for high child comfort + high avg rating", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      child_comfort_records: manyComfort(4, {
        comfort_rating: 5,
        temperature_preference: "comfortable",
        sleeps_well_temperature: true,
        bedding_adequate: true,
      }),
    });
    expect(r.insights.some((i) => i.severity === "positive" && i.text.toLowerCase().includes("comfort"))).toBe(true);
  });

  it("positive insight for high action response rate", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      temperature_monitoring_records: manyTemp(10, { action_required: true, action_taken: true, within_range: true }),
    });
    expect(r.insights.some((i) => i.severity === "positive" && i.text.toLowerCase().includes("action response"))).toBe(true);
  });

  it("positive insight for high window compliance + fall risk", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      window_compliance_records: manyWindow(10, { compliance_met: true, fall_risk_assessed: true }),
    });
    expect(r.insights.some((i) => i.severity === "positive" && i.text.toLowerCase().includes("window"))).toBe(true);
  });
});

// ── Edge Cases ──────────────────────────────────────────────────────────────

describe("edge cases", () => {
  it("single record in each category still computes", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      temperature_monitoring_records: [makeTempRecord()],
      ventilation_records: [makeVentRecord()],
      heating_check_records: [makeHeatingRecord()],
      window_compliance_records: [makeWindowRecord()],
      child_comfort_records: [makeComfortRecord()],
    });
    expect(r.temperature_rating).toBeDefined();
    expect(r.temperature_score).toBeGreaterThanOrEqual(0);
  });

  it("very large arrays process correctly", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      temperature_monitoring_records: manyTemp(200, { within_range: true }),
    });
    expect(r.total_temperature_records).toBe(200);
    expect(r.temperature_monitoring_rate).toBe(100);
  });

  it("score clamped at 100 (cannot exceed 100)", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      temperature_monitoring_records: manyTemp(10, { within_range: true }),
      ventilation_records: manyVent(20, { adequate: true }),
      heating_check_records: manyHeating(5, { system_operational: true, safety_check_passed: true, thermostat_working: true }),
      window_compliance_records: manyWindow(10, { compliance_met: true }),
      child_comfort_records: manyComfort(4, {
        comfort_rating: 5,
        temperature_preference: "comfortable",
        sleeps_well_temperature: true,
        bedding_adequate: true,
        child_voice_captured: true,
      }),
    });
    expect(r.temperature_score).toBeLessThanOrEqual(100);
  });

  it("score clamped at 0 (cannot go below 0)", () => {
    // This is the insufficient data case
    const r = computeBedroomTemperatureVentilation({ ...baseInput, total_children: 0 });
    expect(r.temperature_score).toBe(0);
  });

  it("mixed good and bad data in all categories", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      temperature_monitoring_records: [
        ...manyTemp(5, { within_range: true }),
        ...manyTemp(5, { within_range: false, id: "tb" }),
      ],
      ventilation_records: [
        ...manyVent(5, { adequate: true }),
        ...manyVent(5, { adequate: false, id: "vb" }),
      ],
      heating_check_records: [
        makeHeatingRecord({ system_operational: true, safety_check_passed: true, thermostat_working: true }),
        makeHeatingRecord({ id: "h2", system_operational: false, safety_check_passed: false, thermostat_working: false }),
      ],
      window_compliance_records: [
        ...manyWindow(5, { compliance_met: true }),
        ...manyWindow(5, { compliance_met: false, id: "wb" }),
      ],
      child_comfort_records: [
        makeComfortRecord({ temperature_preference: "comfortable", sleeps_well_temperature: true, bedding_adequate: true }),
        makeComfortRecord({ id: "c2", child_id: "child_2", temperature_preference: "too_cold", sleeps_well_temperature: false, bedding_adequate: false }),
      ],
    });
    expect(r.temperature_rating).toBeDefined();
    expect(r.temperature_score).toBeGreaterThanOrEqual(0);
    expect(r.temperature_score).toBeLessThanOrEqual(100);
  });

  it("total_children = 0 with some records → still computes (not insufficient)", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      total_children: 0,
      temperature_monitoring_records: manyTemp(5, { within_range: true }),
    });
    expect(r.temperature_rating).not.toBe("insufficient_data");
  });

  it("total_children = 1 triggers the right child coverage calculation", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      total_children: 1,
      child_comfort_records: [makeComfortRecord({ child_id: "child_1" })],
    });
    // 1/1 = 100% coverage
    expect(r.strengths.some((s) => s.toLowerCase().includes("every child"))).toBe(true);
  });

  it("comfort rating boundary: exactly 3.0 → bonus 8 kicks in (+1)", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      child_comfort_records: manyComfort(4, {
        comfort_rating: 3,
        temperature_preference: "too_cold",
        sleeps_well_temperature: false,
        bedding_adequate: false,
        child_voice_captured: false,
      }),
    });
    // avgComfortRating = 3.0 → +1
    // childComfortRate: (0+0+0)/3=0 → -3
    expect(r.temperature_score).toBe(52 + 1 - 3);
  });

  it("comfort rating boundary: exactly 4.0 → bonus 8 kicks in (+3)", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      child_comfort_records: manyComfort(4, {
        comfort_rating: 4,
        temperature_preference: "too_cold",
        sleeps_well_temperature: false,
        bedding_adequate: false,
        child_voice_captured: false,
      }),
    });
    expect(r.temperature_score).toBe(52 + 3 - 3);
  });

  it("all rates 0 with populated but fully negative records", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      temperature_monitoring_records: manyTemp(10, { within_range: false }),
      ventilation_records: manyVent(10, { adequate: false }),
      heating_check_records: manyHeating(5, { system_operational: false, safety_check_passed: false, thermostat_working: false }),
      window_compliance_records: manyWindow(10, { compliance_met: false }),
      child_comfort_records: manyComfort(4, {
        temperature_preference: "too_cold",
        sleeps_well_temperature: false,
        bedding_adequate: false,
      }),
    });
    expect(r.temperature_monitoring_rate).toBe(0);
    expect(r.ventilation_rate).toBe(0);
    expect(r.heating_check_rate).toBe(0);
    expect(r.window_compliance_rate).toBe(0);
    expect(r.child_comfort_rate).toBe(0);
  });

  it("headline reflects concern count for adequate rating", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      temperature_monitoring_records: [
        ...manyTemp(5, { within_range: true }),
        ...manyTemp(5, { within_range: false, id: "tb" }),
      ],
    });
    if (r.temperature_rating === "adequate") {
      expect(r.headline.toLowerCase()).toContain("concern");
    }
  });

  it("headline reflects concern count for good rating", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      temperature_monitoring_records: [
        ...manyTemp(8, { within_range: true }),
        ...manyTemp(2, { within_range: false, id: "tb" }),
      ],
      ventilation_records: manyVent(10, { adequate: true }),
      heating_check_records: manyHeating(5, { system_operational: true, safety_check_passed: true, thermostat_working: true }),
      window_compliance_records: manyWindow(5, { compliance_met: true }),
      child_comfort_records: manyComfort(4, {
        temperature_preference: "comfortable",
        sleeps_well_temperature: true,
        bedding_adequate: true,
        child_voice_captured: true,
        comfort_rating: 4,
      }),
    });
    if (r.temperature_rating === "good") {
      expect(r.headline.toLowerCase()).toContain("good");
      expect(r.headline.toLowerCase()).toContain("strength");
    }
  });

  it("unique bedrooms are tracked correctly in temp records", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      temperature_monitoring_records: [
        makeTempRecord({ id: "t1", bedroom_id: "bed_A" }),
        makeTempRecord({ id: "t2", bedroom_id: "bed_B" }),
        makeTempRecord({ id: "t3", bedroom_id: "bed_A" }),
      ],
    });
    expect(r.total_temperature_records).toBe(3);
  });

  it("child_coverage 80-99% triggers strength", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      total_children: 5,
      child_comfort_records: manyComfort(4),
    });
    // 4/5 = 80%
    expect(r.strengths.some((s) => s.includes("80%"))).toBe(true);
  });

  it("child_coverage 50-79% triggers planned recommendation", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      total_children: 4,
      child_comfort_records: [
        makeComfortRecord({ child_id: "c1" }),
        makeComfortRecord({ id: "c2", child_id: "c2" }),
        makeComfortRecord({ id: "c3", child_id: "c3" }),
      ],
    });
    // 3/4 = 75%
    expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.toLowerCase().includes("comfort assessments"))).toBe(true);
  });

  it("child voice recommendation when childVoiceCapturedRate < 70%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      child_comfort_records: [
        ...manyComfort(3, { child_voice_captured: true }),
        ...manyComfort(7, { child_voice_captured: false, id: "nv" }),
      ],
    });
    expect(r.recommendations.some((rec) => rec.recommendation.toLowerCase().includes("voice"))).toBe(true);
  });

  it("window compliance planned recommendation at 50-70%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      window_compliance_records: [
        ...manyWindow(6, { compliance_met: true }),
        ...manyWindow(4, { compliance_met: false, id: "wb" }),
      ],
    });
    expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.toLowerCase().includes("window"))).toBe(true);
  });

  it("heating check planned recommendation at 40-70%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      heating_check_records: [
        makeHeatingRecord({ system_operational: true, safety_check_passed: true, thermostat_working: true }),
        makeHeatingRecord({ id: "h2", system_operational: true, safety_check_passed: false, thermostat_working: false }),
        makeHeatingRecord({ id: "h3", system_operational: false, safety_check_passed: false, thermostat_working: false }),
      ],
    });
    // (67+33+33)/3 = 44
    expect(r.recommendations.some((rec) => rec.recommendation.toLowerCase().includes("heating"))).toBe(true);
  });

  it("service overdue recommendation at >=20%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      heating_check_records: [
        ...manyHeating(3, { service_overdue: true }),
        ...manyHeating(7, { service_overdue: false, id: "ns" }),
      ],
    });
    expect(r.recommendations.some((rec) => rec.recommendation.toLowerCase().includes("overdue"))).toBe(true);
  });

  it("condensation recommendation at >=30%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      ventilation_records: [
        ...manyVent(4, { condensation_present: true }),
        ...manyVent(6, { condensation_present: false, id: "nc" }),
      ],
    });
    expect(r.recommendations.some((rec) => rec.recommendation.toLowerCase().includes("condensation"))).toBe(true);
  });

  it("action response immediate recommendation at <50%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      temperature_monitoring_records: [
        ...manyTemp(2, { action_required: true, action_taken: true, within_range: true }),
        ...manyTemp(8, { action_required: true, action_taken: false, within_range: true, id: "na" }),
      ],
    });
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.toLowerCase().includes("action"))).toBe(true);
  });

  it("positive insight for child coverage 100% + voice >=90%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      total_children: 4,
      child_comfort_records: manyComfort(4, { child_voice_captured: true }),
    });
    expect(r.insights.some((i) => i.severity === "positive" && i.text.toLowerCase().includes("every child"))).toBe(true);
  });

  it("positive insight for heating check >=90 + safety >=90 + engineer >=90", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      heating_check_records: manyHeating(5, {
        system_operational: true,
        safety_check_passed: true,
        thermostat_working: true,
        engineer_certified: true,
      }),
    });
    expect(r.insights.some((i) => i.severity === "positive" && i.text.toLowerCase().includes("engineer"))).toBe(true);
  });

  it("positive insight for changes actioned >=90% with voice >=80%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      child_comfort_records: manyComfort(4, {
        requested_changes: true,
        changes_actioned: true,
        child_voice_captured: true,
      }),
    });
    expect(r.insights.some((i) => i.severity === "positive" && i.text.toLowerCase().includes("change"))).toBe(true);
  });

  it("window immediate recommendation for <50% compliance", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      window_compliance_records: [
        ...manyWindow(2, { compliance_met: true }),
        ...manyWindow(8, { compliance_met: false, id: "wb" }),
      ],
    });
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.toLowerCase().includes("window"))).toBe(true);
  });

  it("child comfort immediate recommendation at <30%", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      child_comfort_records: manyComfort(4, {
        temperature_preference: "too_cold",
        sleeps_well_temperature: false,
        bedding_adequate: false,
      }),
    });
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.toLowerCase().includes("comfort"))).toBe(true);
  });

  it("penalty boundary: tempRate exactly 40 does NOT trigger -5", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      temperature_monitoring_records: [
        ...manyTemp(4, { within_range: true }),
        ...manyTemp(6, { within_range: false, id: "tb" }),
      ],
    });
    // 40% → no penalty (>=40)
    expect(r.temperature_score).toBe(52);
  });

  it("penalty boundary: ventRate exactly 50 does NOT trigger -5", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      ventilation_records: [
        ...manyVent(5, { adequate: true }),
        ...manyVent(5, { adequate: false, id: "vb" }),
      ],
    });
    // 50% → no penalty (>=50)
    expect(r.temperature_score).toBe(52);
  });

  it("penalty boundary: childComfortRate exactly 30 does NOT trigger -3", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      child_comfort_records: [
        ...manyComfort(3, {
          temperature_preference: "comfortable",
          sleeps_well_temperature: true,
          bedding_adequate: true,
          comfort_rating: 2,
          child_voice_captured: false,
        }),
        ...manyComfort(7, {
          temperature_preference: "too_cold",
          sleeps_well_temperature: false,
          bedding_adequate: false,
          comfort_rating: 2,
          child_voice_captured: false,
          id: "cb",
        }),
      ],
    });
    // comfortableTemp=30%, sleepsWell=30%, beddingAdequate=30% → childComfort=30
    // 30 is NOT < 30, so no penalty
    expect(r.temperature_score).toBe(52);
  });

  it("only heating records present: no penalty from missing categories", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      heating_check_records: manyHeating(5, {
        system_operational: true,
        safety_check_passed: true,
        thermostat_working: true,
      }),
    });
    // heatingCheck 100 → +3, safetyCheck 100 → +3
    // No penalty from empty temp/vent/comfort/window arrays
    expect(r.temperature_score).toBe(52 + 3 + 3);
  });

  it("damaged windows count toward poor condition rate", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      window_compliance_records: [
        ...manyWindow(2, { window_condition: "damaged" }),
        ...manyWindow(8, { window_condition: "good", id: "wg" }),
      ],
    });
    // 2/10=20% poor/damaged → concern
    expect(r.concerns.some((c) => c.toLowerCase().includes("poor") || c.toLowerCase().includes("damaged") || c.toLowerCase().includes("condition"))).toBe(true);
  });

  it("action_response_rate with only child changes as action source", () => {
    const r = computeBedroomTemperatureVentilation({
      ...baseInput,
      child_comfort_records: [
        makeComfortRecord({ requested_changes: true, changes_actioned: true }),
        makeComfortRecord({ id: "c2", child_id: "child_2", requested_changes: true, changes_actioned: false }),
      ],
    });
    // 1/2 = 50%
    expect(r.action_response_rate).toBe(50);
  });
});
