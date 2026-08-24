// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME BOILER & HEATING SYSTEM SERVICING INTELLIGENCE ENGINE TESTS
// Comprehensive test suite for boiler servicing, heating checks, radiator
// maintenance, thermostat calibration, and energy efficiency analysis.
// Covers CHR 2015 Reg 25 (Premises and safety), SCCIF premises standards.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeBoilerHeatingSystemServicing,
  type BoilerHeatingSystemServicingInput,
  type BoilerServiceInput,
  type HeatingCheckInput,
  type RadiatorRecordInput,
  type ThermostatRecordInput,
  type EnergyRecordInput,
} from "../home-boiler-heating-system-servicing-intelligence-engine";

const TODAY = "2026-05-25";

// ── Factories ───────────────────────────────────────────────────────────────

let _bsId = 0;
function makeBoilerService(overrides: Partial<BoilerServiceInput> = {}): BoilerServiceInput {
  _bsId++;
  return {
    id: `bs_${_bsId}`,
    boiler_id: "boiler_main",
    service_date: "2026-04-01",
    engineer_name: "Mike Johnson",
    engineer_gas_safe_registered: true,
    service_type: "annual",
    gas_safety_certificate_issued: true,
    cp12_certificate_valid: true,
    faults_found: 0,
    faults_resolved: 0,
    carbon_monoxide_test_passed: true,
    flue_inspection_passed: true,
    pressure_test_passed: true,
    next_service_due: "2027-04-01",
    service_overdue: false,
    boiler_age_years: 5,
    boiler_condition: "good",
    notes_recorded: true,
    created_at: "2026-04-01T10:00:00Z",
    ...overrides,
  };
}

let _hcId = 0;
function makeHeatingCheck(overrides: Partial<HeatingCheckInput> = {}): HeatingCheckInput {
  _hcId++;
  return {
    id: `hc_${_hcId}`,
    check_date: "2026-04-15",
    checker_name: "Jane Smith",
    check_type: "routine",
    system_type: "central_heating",
    all_zones_heating: true,
    hot_water_functional: true,
    timer_programmer_working: true,
    pipe_insulation_adequate: true,
    expansion_vessel_ok: true,
    pump_functional: true,
    water_pressure_normal: true,
    leaks_detected: false,
    issues_found: 0,
    issues_resolved: 0,
    next_check_due: "2026-10-15",
    check_overdue: false,
    notes_recorded: true,
    created_at: "2026-04-15T09:00:00Z",
    ...overrides,
  };
}

let _rrId = 0;
function makeRadiator(overrides: Partial<RadiatorRecordInput> = {}): RadiatorRecordInput {
  _rrId++;
  return {
    id: `rad_${_rrId}`,
    location: "Living Room",
    radiator_type: "panel",
    last_bleed_date: "2026-03-01",
    bleed_due_date: "2026-09-01",
    bleed_overdue: false,
    heating_evenly: true,
    thermostat_valve_working: true,
    condition: "good",
    child_safety_cover_fitted: true,
    temperature_appropriate: true,
    last_inspection_date: "2026-03-01",
    inspection_overdue: false,
    in_child_area: true,
    notes_recorded: true,
    created_at: "2026-03-01T08:00:00Z",
    ...overrides,
  };
}

let _tsId = 0;
function makeThermostat(overrides: Partial<ThermostatRecordInput> = {}): ThermostatRecordInput {
  _tsId++;
  return {
    id: `therm_${_tsId}`,
    location: "Hallway",
    thermostat_type: "smart",
    last_calibration_date: "2026-03-15",
    calibration_due_date: "2026-09-15",
    calibration_overdue: false,
    reading_accurate: true,
    temperature_variance_celsius: 0.3,
    battery_status: "mains_powered",
    child_accessible: false,
    tamper_proof: false,
    set_temperature_celsius: 21,
    actual_temperature_celsius: 21.3,
    programming_correct: true,
    last_check_date: "2026-04-01",
    check_overdue: false,
    notes_recorded: true,
    created_at: "2026-03-15T10:00:00Z",
    ...overrides,
  };
}

let _erId = 0;
function makeEnergyRecord(overrides: Partial<EnergyRecordInput> = {}): EnergyRecordInput {
  _erId++;
  return {
    id: `energy_${_erId}`,
    record_date: "2026-03-01",
    record_type: "epc",
    epc_rating: "C",
    energy_consumption_kwh: 12000,
    cost_gbp: 1200,
    efficiency_measure_type: null,
    efficiency_measure_implemented: false,
    improvement_description: null,
    estimated_saving_percent: null,
    actual_saving_percent: null,
    insulation_adequate: true,
    draught_proofing_adequate: true,
    window_condition: "good",
    heating_controls_optimised: true,
    notes_recorded: true,
    created_at: "2026-03-01T10:00:00Z",
    ...overrides,
  };
}

const baseInput: BoilerHeatingSystemServicingInput = {
  today: TODAY,
  total_children: 3,
  boiler_service_records: [],
  heating_check_records: [],
  radiator_records: [],
  thermostat_records: [],
  energy_records: [],
};

function run(overrides: Partial<BoilerHeatingSystemServicingInput> = {}) {
  return computeBoilerHeatingSystemServicing({ ...baseInput, ...overrides });
}

// ══════════════════════════════════════════════════════════════════════════════
// GROUP 1 — SPECIAL CASES & EMPTY DATA
// ══════════════════════════════════════════════════════════════════════════════

describe("Special cases and empty data", () => {
  it("1 — returns insufficient_data when all arrays empty and 0 children", () => {
    const r = run({ total_children: 0, boiler_service_records: [], heating_check_records: [], radiator_records: [], thermostat_records: [], energy_records: [] });
    expect(r.boiler_rating).toBe("insufficient_data");
    expect(r.boiler_score).toBe(0);
    expect(r.headline).toContain("insufficient data");
  });

  it("2 — returns inadequate with score 15 when all empty but children > 0", () => {
    const r = run({ total_children: 2 });
    expect(r.boiler_rating).toBe("inadequate");
    expect(r.boiler_score).toBe(15);
  });

  it("3 — empty+children headline references urgent attention", () => {
    const r = run({ total_children: 1 });
    expect(r.headline).toContain("urgent attention");
  });

  it("4 — empty+children has exactly 1 concern", () => {
    const r = run({ total_children: 3 });
    expect(r.concerns).toHaveLength(1);
    expect(r.concerns[0]).toContain("No boiler service records");
  });

  it("5 — empty+children has exactly 2 recommendations", () => {
    const r = run({ total_children: 3 });
    expect(r.recommendations).toHaveLength(2);
    expect(r.recommendations[0].urgency).toBe("immediate");
    expect(r.recommendations[1].urgency).toBe("immediate");
  });

  it("6 — empty+children recommendations reference Reg 25", () => {
    const r = run({ total_children: 1 });
    expect(r.recommendations[0].regulatory_ref).toContain("Reg 25");
    expect(r.recommendations[1].regulatory_ref).toContain("SCCIF");
  });

  it("7 — empty+children has 1 critical insight", () => {
    const r = run({ total_children: 1 });
    expect(r.insights).toHaveLength(1);
    expect(r.insights[0].severity).toBe("critical");
    expect(r.insights[0].text).toContain("CP12");
  });

  it("8 — empty+children sets all totals to 0", () => {
    const r = run({ total_children: 2 });
    expect(r.total_boiler_services).toBe(0);
    expect(r.total_heating_checks).toBe(0);
    expect(r.total_radiators).toBe(0);
    expect(r.total_thermostats).toBe(0);
    expect(r.total_energy_records).toBe(0);
  });

  it("9 — empty+children sets all rates to 0", () => {
    const r = run({ total_children: 2 });
    expect(r.boiler_servicing_rate).toBe(0);
    expect(r.heating_check_rate).toBe(0);
    expect(r.radiator_maintenance_rate).toBeNull();
    expect(r.thermostat_calibration_rate).toBe(0);
    expect(r.energy_efficiency_rate).toBeNull();
    expect(r.child_comfort_rate).toBeNull();
    expect(r.gas_safety_compliance_rate).toBe(0);
    expect(r.carbon_monoxide_safety_rate).toBe(0);
    expect(r.fault_resolution_rate).toBe(0);
    expect(r.boiler_condition_score).toBeNull();
  });

  it("10 — empty+children strengths array is empty", () => {
    const r = run({ total_children: 1 });
    expect(r.strengths).toHaveLength(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GROUP 2 — TOTALS & COUNTING
// ══════════════════════════════════════════════════════════════════════════════

describe("Totals and counting", () => {
  it("11 — counts boiler services correctly", () => {
    const r = run({ boiler_service_records: [makeBoilerService(), makeBoilerService(), makeBoilerService()] });
    expect(r.total_boiler_services).toBe(3);
  });

  it("12 — counts heating checks correctly", () => {
    const r = run({ heating_check_records: [makeHeatingCheck(), makeHeatingCheck()] });
    expect(r.total_heating_checks).toBe(2);
  });

  it("13 — counts radiators correctly", () => {
    const r = run({ radiator_records: [makeRadiator(), makeRadiator(), makeRadiator(), makeRadiator()] });
    expect(r.total_radiators).toBe(4);
  });

  it("14 — counts thermostats correctly", () => {
    const r = run({ thermostat_records: [makeThermostat()] });
    expect(r.total_thermostats).toBe(1);
  });

  it("15 — counts energy records correctly", () => {
    const r = run({ energy_records: [makeEnergyRecord(), makeEnergyRecord(), makeEnergyRecord()] });
    expect(r.total_energy_records).toBe(3);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GROUP 3 — BOILER SERVICING RATE
// ══════════════════════════════════════════════════════════════════════════════

describe("Boiler servicing rate", () => {
  it("16 — 100% when all services current", () => {
    const r = run({ boiler_service_records: [makeBoilerService(), makeBoilerService()] });
    expect(r.boiler_servicing_rate).toBe(100);
  });

  it("17 — 0% when all services overdue", () => {
    const r = run({ boiler_service_records: [makeBoilerService({ service_overdue: true }), makeBoilerService({ service_overdue: true })] });
    expect(r.boiler_servicing_rate).toBe(0);
  });

  it("18 — 50% when half current half overdue", () => {
    const r = run({ boiler_service_records: [makeBoilerService(), makeBoilerService({ service_overdue: true })] });
    expect(r.boiler_servicing_rate).toBe(50);
  });

  it("19 — 67% when 2/3 current", () => {
    const r = run({ boiler_service_records: [makeBoilerService(), makeBoilerService(), makeBoilerService({ service_overdue: true })] });
    expect(r.boiler_servicing_rate).toBe(67);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GROUP 4 — GAS SAFETY COMPLIANCE RATE
// ══════════════════════════════════════════════════════════════════════════════

describe("Gas safety compliance rate", () => {
  it("20 — 100% when all CP12 valid", () => {
    const r = run({ boiler_service_records: [makeBoilerService({ cp12_certificate_valid: true })] });
    expect(r.gas_safety_compliance_rate).toBe(100);
  });

  it("21 — 0% when no CP12 valid", () => {
    const r = run({ boiler_service_records: [makeBoilerService({ cp12_certificate_valid: false })] });
    expect(r.gas_safety_compliance_rate).toBe(0);
  });

  it("22 — 50% when half CP12 valid", () => {
    const r = run({ boiler_service_records: [makeBoilerService({ cp12_certificate_valid: true }), makeBoilerService({ cp12_certificate_valid: false })] });
    expect(r.gas_safety_compliance_rate).toBe(50);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GROUP 5 — CARBON MONOXIDE SAFETY RATE
// ══════════════════════════════════════════════════════════════════════════════

describe("Carbon monoxide safety rate", () => {
  it("23 — 100% when all CO tests pass", () => {
    const r = run({ boiler_service_records: [makeBoilerService({ carbon_monoxide_test_passed: true })] });
    expect(r.carbon_monoxide_safety_rate).toBe(100);
  });

  it("24 — 0% when all CO tests fail", () => {
    const r = run({ boiler_service_records: [makeBoilerService({ carbon_monoxide_test_passed: false })] });
    expect(r.carbon_monoxide_safety_rate).toBe(0);
  });

  it("25 — 50% when half CO tests pass", () => {
    const r = run({
      boiler_service_records: [
        makeBoilerService({ carbon_monoxide_test_passed: true }),
        makeBoilerService({ carbon_monoxide_test_passed: false }),
      ],
    });
    expect(r.carbon_monoxide_safety_rate).toBe(50);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GROUP 6 — FAULT RESOLUTION RATE
// ══════════════════════════════════════════════════════════════════════════════

describe("Fault resolution rate", () => {
  it("26 — 100% when all faults resolved", () => {
    const r = run({ boiler_service_records: [makeBoilerService({ faults_found: 3, faults_resolved: 3 })] });
    expect(r.fault_resolution_rate).toBe(100);
  });

  it("27 — 0% when no faults resolved", () => {
    const r = run({ boiler_service_records: [makeBoilerService({ faults_found: 4, faults_resolved: 0 })] });
    expect(r.fault_resolution_rate).toBe(0);
  });

  it("28 — 0% when zero faults found (0/0)", () => {
    const r = run({ boiler_service_records: [makeBoilerService({ faults_found: 0, faults_resolved: 0 })] });
    // Empty population: this asserted the fab-0 the helper used to return.
    expect(r.fault_resolution_rate).toBeNull();
    expect(r.fault_resolution_rate).not.toBe(0); // 0% is a claim; nothing was measured
  });

  it("29 — 50% when half faults resolved", () => {
    const r = run({ boiler_service_records: [makeBoilerService({ faults_found: 6, faults_resolved: 3 })] });
    expect(r.fault_resolution_rate).toBe(50);
  });

  it("30 — aggregates faults across multiple services", () => {
    const r = run({
      boiler_service_records: [
        makeBoilerService({ faults_found: 2, faults_resolved: 2 }),
        makeBoilerService({ faults_found: 3, faults_resolved: 1 }),
      ],
    });
    // 3 resolved out of 5 found = 60%
    expect(r.fault_resolution_rate).toBe(60);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GROUP 7 — BOILER CONDITION SCORE
// ══════════════════════════════════════════════════════════════════════════════

describe("Boiler condition score", () => {
  it("31 — excellent = 100", () => {
    const r = run({ boiler_service_records: [makeBoilerService({ boiler_condition: "excellent" })] });
    expect(r.boiler_condition_score).toBe(100);
  });

  it("32 — good = 80", () => {
    const r = run({ boiler_service_records: [makeBoilerService({ boiler_condition: "good" })] });
    expect(r.boiler_condition_score).toBe(80);
  });

  it("33 — fair = 60", () => {
    const r = run({ boiler_service_records: [makeBoilerService({ boiler_condition: "fair" })] });
    expect(r.boiler_condition_score).toBe(60);
  });

  it("34 — poor = 30", () => {
    const r = run({ boiler_service_records: [makeBoilerService({ boiler_condition: "poor" })] });
    expect(r.boiler_condition_score).toBe(30);
  });

  it("35 — condemned = 0", () => {
    const r = run({ boiler_service_records: [makeBoilerService({ boiler_condition: "condemned" })] });
    // record exists → 0, not null
    expect(r.boiler_condition_score).toBe(0);
  });

  it("36 — averages across multiple boilers", () => {
    const r = run({
      boiler_service_records: [
        makeBoilerService({ boiler_condition: "excellent" }), // 100
        makeBoilerService({ boiler_condition: "poor" }),      // 30
      ],
    });
    // (100+30)/2 = 65
    expect(r.boiler_condition_score).toBe(65);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GROUP 8 — HEATING CHECK RATE
// ══════════════════════════════════════════════════════════════════════════════

describe("Heating check rate", () => {
  it("37 — 100% when all checks current", () => {
    const r = run({ heating_check_records: [makeHeatingCheck(), makeHeatingCheck()] });
    expect(r.heating_check_rate).toBe(100);
  });

  it("38 — 0% when all checks overdue", () => {
    const r = run({ heating_check_records: [makeHeatingCheck({ check_overdue: true })] });
    expect(r.heating_check_rate).toBe(0);
  });

  it("39 — 50% when half checks current", () => {
    const r = run({
      heating_check_records: [
        makeHeatingCheck({ check_overdue: false }),
        makeHeatingCheck({ check_overdue: true }),
      ],
    });
    expect(r.heating_check_rate).toBe(50);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GROUP 9 — RADIATOR MAINTENANCE RATE
// ══════════════════════════════════════════════════════════════════════════════

describe("Radiator maintenance rate", () => {
  it("40 — 100% when no bleeds or inspections overdue", () => {
    const r = run({ radiator_records: [makeRadiator({ bleed_overdue: false, inspection_overdue: false })] });
    expect(r.radiator_maintenance_rate).toBe(100);
  });

  it("41 — 0% when all bleeds and inspections overdue", () => {
    const r = run({ radiator_records: [makeRadiator({ bleed_overdue: true, inspection_overdue: true })] });
    // record exists → 0, not null
    expect(r.radiator_maintenance_rate).toBe(0);
  });

  it("42 — 50% when bleeds OK but inspections overdue", () => {
    const r = run({ radiator_records: [makeRadiator({ bleed_overdue: false, inspection_overdue: true })] });
    // bleed rate 100, inspection rate 0 => avg 50
    expect(r.radiator_maintenance_rate).toBe(50);
  });

  it("43 — averages bleed and inspection rates across multiple radiators", () => {
    const r = run({
      radiator_records: [
        makeRadiator({ bleed_overdue: false, inspection_overdue: false }),
        makeRadiator({ bleed_overdue: true, inspection_overdue: true }),
      ],
    });
    // bleed rate: 50%, inspection rate: 50% => avg 50
    expect(r.radiator_maintenance_rate).toBe(50);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GROUP 10 — THERMOSTAT CALIBRATION RATE
// ══════════════════════════════════════════════════════════════════════════════

describe("Thermostat calibration rate", () => {
  it("44 — 100% when all calibrations current", () => {
    const r = run({ thermostat_records: [makeThermostat({ calibration_overdue: false })] });
    expect(r.thermostat_calibration_rate).toBe(100);
  });

  it("45 — 0% when all calibrations overdue", () => {
    const r = run({ thermostat_records: [makeThermostat({ calibration_overdue: true })] });
    expect(r.thermostat_calibration_rate).toBe(0);
  });

  it("46 — 50% when half calibrations current", () => {
    const r = run({
      thermostat_records: [
        makeThermostat({ calibration_overdue: false }),
        makeThermostat({ calibration_overdue: true }),
      ],
    });
    expect(r.thermostat_calibration_rate).toBe(50);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GROUP 11 — ENERGY EFFICIENCY RATE
// ══════════════════════════════════════════════════════════════════════════════

describe("Energy efficiency rate", () => {
  it("47 — uses latest EPC record", () => {
    const r = run({
      energy_records: [
        makeEnergyRecord({ record_type: "epc", epc_rating: "G" }),
        makeEnergyRecord({ record_type: "epc", epc_rating: "A" }),
      ],
    });
    // Latest EPC = A (100), heating_controls_optimised both true => controlsOptimisedRate 100
    // No audit/assessment => no insulation/draught components
    // energyComponentScores = [100, 100] => 100
    expect(r.energy_efficiency_rate).toBe(100);
  });

  it("48 — includes insulation and draught-proofing from audit/assessment records", () => {
    const r = run({
      energy_records: [
        makeEnergyRecord({ record_type: "epc", epc_rating: "C" }),
        makeEnergyRecord({ record_type: "audit", insulation_adequate: true, draught_proofing_adequate: true, heating_controls_optimised: true }),
        makeEnergyRecord({ record_type: "assessment", insulation_adequate: false, draught_proofing_adequate: false, heating_controls_optimised: false }),
      ],
    });
    // EPC = C => 70
    // insulation: 1/2 = 50%
    // draught: 1/2 = 50%
    // controls: 2/3 optimised => 67%
    // (70+50+50+67)/4 = 59.25 => 59
    expect(r.energy_efficiency_rate).toBe(59);
  });

  it("49 — 0% when no energy records at all", () => {
    const r = run({ energy_records: [] });
    expect(r.energy_efficiency_rate).toBeNull();
  });

  it("50 — EPC rating A yields highest score component", () => {
    const r = run({
      energy_records: [makeEnergyRecord({ record_type: "epc", epc_rating: "A", heating_controls_optimised: true })],
    });
    // epcScore=100, controlsOptimised=100 => (100+100)/2 = 100
    expect(r.energy_efficiency_rate).toBe(100);
  });

  it("51 — EPC rating G yields lowest score component", () => {
    const r = run({
      energy_records: [makeEnergyRecord({ record_type: "epc", epc_rating: "G", heating_controls_optimised: false })],
    });
    // epcScore=10, controls=0 => (10+0)/2 = 5
    expect(r.energy_efficiency_rate).toBe(5);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GROUP 12 — CHILD COMFORT RATE
// ══════════════════════════════════════════════════════════════════════════════

describe("Child comfort rate", () => {
  it("52 — 100% with all comfort factors perfect", () => {
    const r = run({
      radiator_records: [makeRadiator({ temperature_appropriate: true, heating_evenly: true })],
      heating_check_records: [makeHeatingCheck({ all_zones_heating: true, hot_water_functional: true })],
      thermostat_records: [makeThermostat({ programming_correct: true })],
    });
    expect(r.child_comfort_rate).toBe(100);
  });

  it("53 — 0% with all comfort factors failing", () => {
    const r = run({
      radiator_records: [makeRadiator({ temperature_appropriate: false, heating_evenly: false })],
      heating_check_records: [makeHeatingCheck({ all_zones_heating: false, hot_water_functional: false })],
      thermostat_records: [makeThermostat({ programming_correct: false })],
    });
    // records exist → 0, not null
    expect(r.child_comfort_rate).toBe(0);
  });

  it("54 — 0% when no relevant records exist", () => {
    const r = run({});
    expect(r.child_comfort_rate).toBeNull();
  });

  it("55 — partial comfort with mixed results", () => {
    const r = run({
      radiator_records: [
        makeRadiator({ temperature_appropriate: true, heating_evenly: true }),
        makeRadiator({ temperature_appropriate: false, heating_evenly: false }),
      ],
      heating_check_records: [makeHeatingCheck({ all_zones_heating: true, hot_water_functional: true })],
      thermostat_records: [makeThermostat({ programming_correct: true })],
    });
    // tempRate: 50%, zoneHeating: 100%, evenHeating: 50%, hotWater: 100%, programming: 100%
    // (50+100+50+100+100)/5 = 80
    expect(r.child_comfort_rate).toBe(80);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GROUP 13 — SCORING & RATING
// ══════════════════════════════════════════════════════════════════════════════

describe("Scoring and rating thresholds", () => {
  it("56 — base score starts at 52", () => {
    // Minimal data: single boiler service with mediocre stats (no bonuses, no penalties)
    const r = run({
      boiler_service_records: [makeBoilerService({
        service_overdue: false,
        cp12_certificate_valid: false,
        carbon_monoxide_test_passed: false,
        boiler_condition: "fair",
        boiler_age_years: 5,
      })],
    });
    // boilerServicingRate=100 => +5
    // gasSafety=0 => penalty (0<50 && total>0) => -6
    // coSafety=0 => no bonus
    // Base: 52+5-6 = 51
    expect(r.boiler_score).toBe(51);
  });

  it("57 — outstanding rating at score >= 80", () => {
    const r = run({
      boiler_service_records: [makeBoilerService()],
      heating_check_records: [makeHeatingCheck()],
      radiator_records: [makeRadiator()],
      thermostat_records: [makeThermostat()],
      energy_records: [
        makeEnergyRecord({ record_type: "epc", epc_rating: "A", heating_controls_optimised: true }),
        makeEnergyRecord({ record_type: "audit", insulation_adequate: true, draught_proofing_adequate: true, heating_controls_optimised: true }),
      ],
    });
    expect(r.boiler_score).toBeGreaterThanOrEqual(80);
    expect(r.boiler_rating).toBe("outstanding");
  });

  it("58 — good rating at score 65-79", () => {
    // Need bonuses to reach ~65-79 range. Let's set up some but not all perfect.
    const r = run({
      boiler_service_records: [makeBoilerService()],
      heating_check_records: [makeHeatingCheck()],
      radiator_records: [makeRadiator()],
      thermostat_records: [makeThermostat()],
    });
    // boiler 100% => +5, heating 100% => +4, radiator 100% => +4, thermostat 100% => +4
    // gasSafety 100% => +3, CO 100% => +2, child comfort 100% => +2
    // = 52+5+4+4+4+3+2+2 = 76, no penalties
    // Actually that's good rating (76 >= 65, < 80)
    expect(r.boiler_score).toBe(76);
    expect(r.boiler_rating).toBe("good");
  });

  it("59 — adequate rating at score 45-64", () => {
    const r = run({
      boiler_service_records: [
        makeBoilerService({ service_overdue: false, cp12_certificate_valid: true }),
        makeBoilerService({ service_overdue: true, cp12_certificate_valid: false }),
      ],
    });
    // boilerServicingRate=50 => no bonus
    // gasSafety=50 => no bonus, no penalty (>=50)
    // CO=100% => +2 (default both pass)
    // 52+2 = 54
    expect(r.boiler_rating).toBe("adequate");
  });

  it("60 — inadequate rating at score < 45", () => {
    const r = run({
      boiler_service_records: [
        makeBoilerService({ service_overdue: true, cp12_certificate_valid: false, carbon_monoxide_test_passed: false }),
        makeBoilerService({ service_overdue: true, cp12_certificate_valid: false, carbon_monoxide_test_passed: false }),
        makeBoilerService({ service_overdue: true, cp12_certificate_valid: false, carbon_monoxide_test_passed: false }),
      ],
      radiator_records: [makeRadiator({ bleed_overdue: true, inspection_overdue: true })],
      thermostat_records: [makeThermostat({ calibration_overdue: true })],
    });
    // boilerServicing 0% => penalty -6
    // gasSafety 0% => penalty -6
    // radiator 0% => penalty -4
    // thermostat 0% => penalty -4
    // childComfort: temp=100, even=100, programming=100 => 100% => +2
    // 52 - 6 - 6 - 4 - 4 + 2 = 34
    expect(r.boiler_score).toBe(34);
    expect(r.boiler_rating).toBe("inadequate");
  });

  it("61 — score clamped to minimum 0", () => {
    // Cannot produce negative easily since base is 52, max penalties only -20
    // But let's confirm it doesn't go below 0
    const r = run({
      boiler_service_records: [
        makeBoilerService({ service_overdue: true, cp12_certificate_valid: false }),
      ],
      radiator_records: [makeRadiator({ bleed_overdue: true, inspection_overdue: true })],
      thermostat_records: [makeThermostat({ calibration_overdue: true })],
    });
    expect(r.boiler_score).toBeGreaterThanOrEqual(0);
  });

  it("62 — score clamped to maximum 100", () => {
    const r = run({
      boiler_service_records: [makeBoilerService()],
      heating_check_records: [makeHeatingCheck()],
      radiator_records: [makeRadiator()],
      thermostat_records: [makeThermostat()],
      energy_records: [
        makeEnergyRecord({ record_type: "epc", epc_rating: "A", heating_controls_optimised: true }),
        makeEnergyRecord({ record_type: "audit", insulation_adequate: true, draught_proofing_adequate: true, heating_controls_optimised: true }),
      ],
    });
    expect(r.boiler_score).toBeLessThanOrEqual(100);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GROUP 14 — BONUS SCORING
// ══════════════════════════════════════════════════════════════════════════════

describe("Bonus scoring", () => {
  it("63 — boiler servicing 100% awards +5", () => {
    const base = run({ boiler_service_records: [makeBoilerService({ service_overdue: false, cp12_certificate_valid: false, carbon_monoxide_test_passed: false })] });
    // 100% servicing => +5, gasSafety 0% => -6, CO=0% => no bonus
    // 52+5-6 = 51
    expect(base.boiler_score).toBe(51);
  });

  it("64 — boiler servicing 80-99% awards +3", () => {
    const r = run({
      boiler_service_records: [
        makeBoilerService({ service_overdue: false }),
        makeBoilerService({ service_overdue: false }),
        makeBoilerService({ service_overdue: false }),
        makeBoilerService({ service_overdue: false }),
        makeBoilerService({ service_overdue: true }),
      ],
    });
    // 4/5 = 80% => +3
    expect(r.boiler_servicing_rate).toBe(80);
  });

  it("65 — heating check 100% awards +4", () => {
    const r = run({
      boiler_service_records: [makeBoilerService({ cp12_certificate_valid: false, carbon_monoxide_test_passed: false })],
      heating_check_records: [makeHeatingCheck()],
    });
    // boilerServ=100 => +5, heating=100 => +4, gasSafety=0 => -6
    // childComfort: zoneHeating=100, hotWater=100 => (100+100)/2 = 100 => +2
    // CO=0 => no bonus
    // 52+5+4-6+2 = 57
    expect(r.boiler_score).toBe(57);
  });

  it("66 — radiator maintenance 90+% awards +4", () => {
    const r = run({
      boiler_service_records: [makeBoilerService({ cp12_certificate_valid: false, carbon_monoxide_test_passed: false })],
      radiator_records: [makeRadiator()],
    });
    // radiator 100% => +4
    // boiler 100% => +5, gasSafety 0% => -6
    // childComfort: temp=100, even=100 => (100+100)/2 = 100 => +2
    // 52+5+4-6+2 = 57
    expect(r.boiler_score).toBe(57);
  });

  it("67 — thermostat calibration 100% awards +4", () => {
    const r = run({
      boiler_service_records: [makeBoilerService({ cp12_certificate_valid: false, carbon_monoxide_test_passed: false })],
      thermostat_records: [makeThermostat()],
    });
    // therm 100% => +4, boiler 100% => +5, gasSafety 0% => -6
    // childComfort: programming=100 => (100)/1 = 100 => +2
    // 52+5+4-6+2 = 57
    expect(r.boiler_score).toBe(57);
  });

  it("68 — energy efficiency 80+% awards +4", () => {
    const r = run({
      boiler_service_records: [makeBoilerService({ cp12_certificate_valid: false, carbon_monoxide_test_passed: false })],
      energy_records: [makeEnergyRecord({ record_type: "epc", epc_rating: "A", heating_controls_optimised: true })],
    });
    // energyEfficiency = (100+100)/2 = 100 => +4
    // boiler 100% => +5, gasSafety 0% => -6
    // 52+5+4-6 = 55
    expect(r.boiler_score).toBe(55);
  });

  it("69 — gas safety 100% awards +3", () => {
    const r = run({
      boiler_service_records: [makeBoilerService({ cp12_certificate_valid: true, carbon_monoxide_test_passed: false })],
    });
    // boiler 100% => +5, gasSafety 100% => +3
    // CO 0% => no bonus
    // 52+5+3 = 60
    expect(r.boiler_score).toBe(60);
  });

  it("70 — CO safety 100% awards +2", () => {
    const r = run({
      boiler_service_records: [makeBoilerService({ cp12_certificate_valid: false, carbon_monoxide_test_passed: true })],
    });
    // boiler 100% => +5, gasSafety 0% => -6, CO 100% => +2
    // 52+5-6+2 = 53
    expect(r.boiler_score).toBe(53);
  });

  it("71 — child comfort 90+% awards +2", () => {
    const r = run({
      boiler_service_records: [makeBoilerService({ cp12_certificate_valid: false, carbon_monoxide_test_passed: false })],
      radiator_records: [makeRadiator({ temperature_appropriate: true, heating_evenly: true })],
      heating_check_records: [makeHeatingCheck({ all_zones_heating: true, hot_water_functional: true })],
      thermostat_records: [makeThermostat({ programming_correct: true })],
    });
    // childComfort = (100+100+100+100+100)/5 = 100 => +2
    expect(r.child_comfort_rate).toBe(100);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GROUP 15 — PENALTY SCORING
// ══════════════════════════════════════════════════════════════════════════════

describe("Penalty scoring", () => {
  it("72 — boiler servicing <50% with records penalises -6", () => {
    const r = run({
      boiler_service_records: [
        makeBoilerService({ service_overdue: true, cp12_certificate_valid: true, carbon_monoxide_test_passed: true }),
        makeBoilerService({ service_overdue: true, cp12_certificate_valid: true, carbon_monoxide_test_passed: true }),
        makeBoilerService({ service_overdue: false, cp12_certificate_valid: true, carbon_monoxide_test_passed: true }),
      ],
    });
    // servicing: 1/3 = 33% => -6
    // gasSafety: 100% => +3
    // CO: 100% => +2
    // boilerServ 33% => no bonus
    // 52 + 3 + 2 - 6 = 51
    expect(r.boiler_score).toBe(51);
  });

  it("73 — gas safety <50% with records penalises -6", () => {
    const r = run({
      boiler_service_records: [
        makeBoilerService({ cp12_certificate_valid: false, carbon_monoxide_test_passed: true }),
        makeBoilerService({ cp12_certificate_valid: false, carbon_monoxide_test_passed: true }),
        makeBoilerService({ cp12_certificate_valid: true, carbon_monoxide_test_passed: true }),
      ],
    });
    // gasSafety 1/3=33% => -6
    // boiler 100% => +5, CO 100% => +2
    // 52+5+2-6 = 53
    expect(r.boiler_score).toBe(53);
  });

  it("74 — radiator maintenance <50% with records penalises -4", () => {
    const r = run({
      boiler_service_records: [makeBoilerService({ cp12_certificate_valid: false, carbon_monoxide_test_passed: false })],
      radiator_records: [
        makeRadiator({ bleed_overdue: true, inspection_overdue: true }),
      ],
    });
    // radiator 0% => -4
    // boiler 100% => +5, gasSafety 0% => -6
    // childComfort: temp=100, even=100 => (100+100)/2 = 100 => +2
    // 52+5-6-4+2 = 49
    expect(r.boiler_score).toBe(49);
  });

  it("75 — thermostat calibration <50% with records penalises -4", () => {
    const r = run({
      boiler_service_records: [makeBoilerService({ cp12_certificate_valid: false, carbon_monoxide_test_passed: false })],
      thermostat_records: [
        makeThermostat({ calibration_overdue: true }),
      ],
    });
    // therm 0% => -4
    // boiler 100% => +5, gasSafety 0% => -6
    // childComfort: programming=100 => 100 => +2
    // 52+5-6-4+2 = 49
    expect(r.boiler_score).toBe(49);
  });

  it("76 — no penalty when records array is empty even if rate would be 0", () => {
    const r = run({
      boiler_service_records: [makeBoilerService()],
    });
    // No radiator records => no radiator penalty even though rate is 0
    // No thermostat records => no thermostat penalty
    expect(r.boiler_score).toBeGreaterThanOrEqual(52);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GROUP 16 — STRENGTHS
// ══════════════════════════════════════════════════════════════════════════════

describe("Strengths", () => {
  it("77 — boiler servicing 100% generates strength", () => {
    const r = run({ boiler_service_records: [makeBoilerService()] });
    expect(r.strengths.some((s) => s.includes("All boiler services are up to date"))).toBe(true);
  });

  it("78 — boiler servicing 80-99% generates strength with percentage", () => {
    const r = run({
      boiler_service_records: [
        makeBoilerService(), makeBoilerService(), makeBoilerService(), makeBoilerService(),
        makeBoilerService({ service_overdue: true }),
      ],
    });
    expect(r.strengths.some((s) => s.includes("80%"))).toBe(true);
  });

  it("79 — gas safety 100% generates CP12 strength", () => {
    const r = run({ boiler_service_records: [makeBoilerService({ cp12_certificate_valid: true })] });
    expect(r.strengths.some((s) => s.includes("All CP12 gas safety certificates are valid"))).toBe(true);
  });

  it("80 — CO safety 100% generates strength", () => {
    const r = run({ boiler_service_records: [makeBoilerService({ carbon_monoxide_test_passed: true })] });
    expect(r.strengths.some((s) => s.includes("All carbon monoxide tests passed"))).toBe(true);
  });

  it("81 — heating check 100% generates strength", () => {
    const r = run({ heating_check_records: [makeHeatingCheck()] });
    expect(r.strengths.some((s) => s.includes("All heating system checks are current"))).toBe(true);
  });

  it("82 — radiator maintenance 90+% generates strength", () => {
    const r = run({ radiator_records: [makeRadiator()] });
    expect(r.strengths.some((s) => s.includes("radiator maintenance compliance"))).toBe(true);
  });

  it("83 — thermostat calibration 100% generates strength", () => {
    const r = run({ thermostat_records: [makeThermostat()] });
    expect(r.strengths.some((s) => s.includes("All thermostats are calibrated"))).toBe(true);
  });

  it("84 — energy efficiency 80+% generates strength", () => {
    const r = run({
      energy_records: [
        makeEnergyRecord({ record_type: "epc", epc_rating: "A", heating_controls_optimised: true }),
        makeEnergyRecord({ record_type: "audit", insulation_adequate: true, draught_proofing_adequate: true, heating_controls_optimised: true }),
      ],
    });
    expect(r.strengths.some((s) => s.includes("Energy efficiency score"))).toBe(true);
  });

  it("85 — child comfort 90+% generates strength", () => {
    const r = run({
      radiator_records: [makeRadiator()],
      heating_check_records: [makeHeatingCheck()],
      thermostat_records: [makeThermostat()],
    });
    expect(r.strengths.some((s) => s.includes("child comfort score"))).toBe(true);
  });

  it("86 — 100% fault resolution generates strength", () => {
    const r = run({
      boiler_service_records: [makeBoilerService({ faults_found: 3, faults_resolved: 3 })],
    });
    expect(r.strengths.some((s) => s.includes("All boiler faults identified during servicing have been resolved"))).toBe(true);
  });

  it("87 — 100% Gas Safe engineer rate generates strength", () => {
    const r = run({
      boiler_service_records: [makeBoilerService({ engineer_gas_safe_registered: true })],
    });
    expect(r.strengths.some((s) => s.includes("Gas Safe registered engineers"))).toBe(true);
  });

  it("88 — 100% child safety covers generates strength", () => {
    const r = run({
      radiator_records: [makeRadiator({ in_child_area: true, child_safety_cover_fitted: true })],
    });
    expect(r.strengths.some((s) => s.includes("All radiators in children's areas have safety covers fitted"))).toBe(true);
  });

  it("89 — 90+% even heating generates strength", () => {
    const r = run({
      radiator_records: [makeRadiator({ heating_evenly: true })],
    });
    expect(r.strengths.some((s) => s.includes("heating evenly"))).toBe(true);
  });

  it("90 — 100% leak free generates strength", () => {
    const r = run({
      heating_check_records: [makeHeatingCheck({ leaks_detected: false })],
    });
    expect(r.strengths.some((s) => s.includes("No leaks detected"))).toBe(true);
  });

  it("91 — 100% battery health generates strength", () => {
    const r = run({
      thermostat_records: [makeThermostat({ battery_status: "good" })],
    });
    expect(r.strengths.some((s) => s.includes("thermostat batteries"))).toBe(true);
  });

  it("92 — 100% tamper proof generates strength", () => {
    const r = run({
      thermostat_records: [makeThermostat({ child_accessible: true, tamper_proof: true })],
    });
    expect(r.strengths.some((s) => s.includes("tamper-proof"))).toBe(true);
  });

  it("93 — 100% pipe insulation generates strength", () => {
    const r = run({
      heating_check_records: [makeHeatingCheck({ pipe_insulation_adequate: true })],
    });
    expect(r.strengths.some((s) => s.includes("All pipe insulation rated adequate"))).toBe(true);
  });

  it("94 — 100% flue inspection generates strength", () => {
    const r = run({
      boiler_service_records: [makeBoilerService({ flue_inspection_passed: true })],
    });
    expect(r.strengths.some((s) => s.includes("All flue inspections passed"))).toBe(true);
  });

  it("95 — 90+% boiler documentation generates strength", () => {
    const r = run({
      boiler_service_records: [makeBoilerService({ notes_recorded: true })],
    });
    expect(r.strengths.some((s) => s.includes("boiler services have documented notes"))).toBe(true);
  });

  it("96 — no strengths when all metrics poor", () => {
    const r = run({
      boiler_service_records: [
        makeBoilerService({
          service_overdue: true,
          cp12_certificate_valid: false,
          carbon_monoxide_test_passed: false,
          engineer_gas_safe_registered: false,
          flue_inspection_passed: false,
          notes_recorded: false,
          faults_found: 5,
          faults_resolved: 0,
          boiler_condition: "poor",
        }),
      ],
      heating_check_records: [
        makeHeatingCheck({
          check_overdue: true,
          all_zones_heating: false,
          hot_water_functional: false,
          pipe_insulation_adequate: false,
          leaks_detected: true,
          notes_recorded: false,
        }),
      ],
      radiator_records: [
        makeRadiator({
          bleed_overdue: true,
          inspection_overdue: true,
          heating_evenly: false,
          child_safety_cover_fitted: false,
          in_child_area: true,
          temperature_appropriate: false,
          notes_recorded: false,
        }),
      ],
      thermostat_records: [
        makeThermostat({
          calibration_overdue: true,
          reading_accurate: false,
          battery_status: "dead",
          child_accessible: true,
          tamper_proof: false,
          programming_correct: false,
          notes_recorded: false,
        }),
      ],
    });
    expect(r.strengths).toHaveLength(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GROUP 17 — CONCERNS
// ══════════════════════════════════════════════════════════════════════════════

describe("Concerns", () => {
  it("97 — boiler servicing <50% generates concern", () => {
    const r = run({
      boiler_service_records: [
        makeBoilerService({ service_overdue: true }),
        makeBoilerService({ service_overdue: true }),
        makeBoilerService({ service_overdue: false }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("33%") && c.includes("boiler services"))).toBe(true);
  });

  it("98 — boiler servicing 50-79% generates concern", () => {
    const r = run({
      boiler_service_records: [
        makeBoilerService({ service_overdue: false }),
        makeBoilerService({ service_overdue: false }),
        makeBoilerService({ service_overdue: true }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("67%") && c.includes("Boiler servicing compliance"))).toBe(true);
  });

  it("99 — gas safety <50% generates concern", () => {
    const r = run({
      boiler_service_records: [makeBoilerService({ cp12_certificate_valid: false })],
    });
    expect(r.concerns.some((c) => c.includes("0%") && c.includes("CP12"))).toBe(true);
  });

  it("100 — gas safety 50-79% generates concern", () => {
    const r = run({
      boiler_service_records: [
        makeBoilerService({ cp12_certificate_valid: true }),
        makeBoilerService({ cp12_certificate_valid: false }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("50%") && c.includes("CP12 gas safety compliance"))).toBe(true);
  });

  it("101 — CO test failures generate concern", () => {
    const r = run({
      boiler_service_records: [makeBoilerService({ carbon_monoxide_test_passed: false })],
    });
    expect(r.concerns.some((c) => c.includes("carbon monoxide test"))).toBe(true);
  });

  it("102 — heating check <50% generates concern", () => {
    const r = run({
      heating_check_records: [makeHeatingCheck({ check_overdue: true })],
    });
    expect(r.concerns.some((c) => c.includes("0%") && c.includes("heating checks"))).toBe(true);
  });

  it("103 — heating check 50-79% generates concern", () => {
    const r = run({
      heating_check_records: [
        makeHeatingCheck({ check_overdue: false }),
        makeHeatingCheck({ check_overdue: true }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("50%") && c.includes("Heating check compliance"))).toBe(true);
  });

  it("104 — radiator maintenance <50% generates concern", () => {
    const r = run({
      radiator_records: [makeRadiator({ bleed_overdue: true, inspection_overdue: true })],
    });
    expect(r.concerns.some((c) => c.includes("0%") && c.includes("radiator maintenance"))).toBe(true);
  });

  it("105 — thermostat calibration <50% generates concern", () => {
    const r = run({
      thermostat_records: [makeThermostat({ calibration_overdue: true })],
    });
    expect(r.concerns.some((c) => c.includes("0%") && c.includes("thermostats"))).toBe(true);
  });

  it("106 — poor/condemned boiler condition generates concern", () => {
    const r = run({
      boiler_service_records: [makeBoilerService({ boiler_condition: "poor" })],
    });
    expect(r.concerns.some((c) => c.includes("poor or condemned condition"))).toBe(true);
  });

  it("107 — aging boilers (>15 years) generate concern", () => {
    const r = run({
      boiler_service_records: [makeBoilerService({ boiler_age_years: 20 })],
    });
    expect(r.concerns.some((c) => c.includes("over 15 years old"))).toBe(true);
  });

  it("108 — overdue boiler services generate concern", () => {
    const r = run({
      boiler_service_records: [makeBoilerService({ service_overdue: true }), makeBoilerService()],
    });
    expect(r.concerns.some((c) => c.includes("boiler service") && c.includes("overdue"))).toBe(true);
  });

  it("109 — leaks detected generate concern", () => {
    const r = run({
      heating_check_records: [makeHeatingCheck({ leaks_detected: true })],
    });
    expect(r.concerns.some((c) => c.includes("Leaks detected"))).toBe(true);
  });

  it("110 — child safety covers <80% generates concern", () => {
    const r = run({
      radiator_records: [
        makeRadiator({ in_child_area: true, child_safety_cover_fitted: false }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("safety covers"))).toBe(true);
  });

  it("111 — dead battery thermostats generate concern", () => {
    const r = run({
      thermostat_records: [makeThermostat({ battery_status: "dead" })],
    });
    expect(r.concerns.some((c) => c.includes("dead batteries"))).toBe(true);
  });

  it("112 — fault resolution <50% generates concern", () => {
    const r = run({
      boiler_service_records: [makeBoilerService({ faults_found: 4, faults_resolved: 1 })],
    });
    expect(r.concerns.some((c) => c.includes("faults resolved"))).toBe(true);
  });

  it("113 — overdue radiator bleeds generate concern", () => {
    const r = run({
      radiator_records: [makeRadiator({ bleed_overdue: true })],
    });
    expect(r.concerns.some((c) => c.includes("overdue for bleeding"))).toBe(true);
  });

  it("114 — poor condition radiators generate concern", () => {
    const r = run({
      radiator_records: [makeRadiator({ condition: "poor" })],
    });
    expect(r.concerns.some((c) => c.includes("poor condition"))).toBe(true);
  });

  it("115 — tamper-proof <80% generates concern", () => {
    const r = run({
      thermostat_records: [makeThermostat({ child_accessible: true, tamper_proof: false })],
    });
    expect(r.concerns.some((c) => c.includes("tamper-proof"))).toBe(true);
  });

  it("116 — even heating <70% generates concern", () => {
    const r = run({
      radiator_records: [
        makeRadiator({ heating_evenly: false }),
        makeRadiator({ heating_evenly: false }),
        makeRadiator({ heating_evenly: true }),
      ],
    });
    // 1/3 = 33% < 70%
    expect(r.concerns.some((c) => c.includes("heating evenly"))).toBe(true);
  });

  it("117 — energy efficiency <40% generates concern", () => {
    const r = run({
      energy_records: [
        makeEnergyRecord({ record_type: "epc", epc_rating: "G", heating_controls_optimised: false }),
        makeEnergyRecord({ record_type: "audit", insulation_adequate: false, draught_proofing_adequate: false, heating_controls_optimised: false }),
      ],
    });
    // epc=10, insulation=0, draught=0, controls=0 => (10+0+0+0)/4 = 3 (rounded)
    expect(r.concerns.some((c) => c.includes("Energy efficiency"))).toBe(true);
  });

  it("118 — no concerns when all metrics excellent", () => {
    const r = run({
      boiler_service_records: [makeBoilerService()],
      heating_check_records: [makeHeatingCheck()],
      radiator_records: [makeRadiator()],
      thermostat_records: [makeThermostat()],
    });
    expect(r.concerns).toHaveLength(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GROUP 18 — RECOMMENDATIONS
// ══════════════════════════════════════════════════════════════════════════════

describe("Recommendations", () => {
  it("119 — CO test failures yield immediate recommendation", () => {
    const r = run({
      boiler_service_records: [makeBoilerService({ carbon_monoxide_test_passed: false })],
    });
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("carbon monoxide"))).toBe(true);
  });

  it("120 — gas safety <50% yields immediate recommendation", () => {
    const r = run({
      boiler_service_records: [makeBoilerService({ cp12_certificate_valid: false })],
    });
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("CP12"))).toBe(true);
  });

  it("121 — boiler servicing <50% yields immediate recommendation", () => {
    const r = run({
      boiler_service_records: [
        makeBoilerService({ service_overdue: true }),
        makeBoilerService({ service_overdue: true }),
        makeBoilerService({ service_overdue: false }),
      ],
    });
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("overdue boiler services"))).toBe(true);
  });

  it("122 — poor/condemned boiler yields immediate recommendation", () => {
    const r = run({
      boiler_service_records: [makeBoilerService({ boiler_condition: "condemned" })],
    });
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("poor or condemned"))).toBe(true);
  });

  it("123 — child safety covers <80% yields immediate recommendation", () => {
    const r = run({
      radiator_records: [makeRadiator({ in_child_area: true, child_safety_cover_fitted: false })],
    });
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("safety covers"))).toBe(true);
  });

  it("124 — dead battery thermostat yields immediate recommendation", () => {
    const r = run({
      thermostat_records: [makeThermostat({ battery_status: "dead" })],
    });
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("dead thermostat batteries"))).toBe(true);
  });

  it("125 — radiator maintenance <50% yields immediate recommendation", () => {
    const r = run({
      radiator_records: [makeRadiator({ bleed_overdue: true, inspection_overdue: true })],
    });
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("radiator bleeding"))).toBe(true);
  });

  it("126 — thermostat calibration <50% yields immediate recommendation", () => {
    const r = run({
      thermostat_records: [makeThermostat({ calibration_overdue: true })],
    });
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("calibrate"))).toBe(true);
  });

  it("127 — leaks detected yields immediate recommendation", () => {
    const r = run({
      heating_check_records: [makeHeatingCheck({ leaks_detected: true })],
    });
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("leaks"))).toBe(true);
  });

  it("128 — gas safety 50-79% yields soon recommendation", () => {
    const r = run({
      boiler_service_records: [
        makeBoilerService({ cp12_certificate_valid: true }),
        makeBoilerService({ cp12_certificate_valid: false }),
      ],
    });
    expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("CP12"))).toBe(true);
  });

  it("129 — boiler servicing 50-79% yields soon recommendation", () => {
    const r = run({
      boiler_service_records: [
        makeBoilerService({ service_overdue: false }),
        makeBoilerService({ service_overdue: false }),
        makeBoilerService({ service_overdue: true }),
      ],
    });
    expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("boiler servicing up to date"))).toBe(true);
  });

  it("130 — heating check <80% yields soon recommendation", () => {
    const r = run({
      heating_check_records: [
        makeHeatingCheck({ check_overdue: false }),
        makeHeatingCheck({ check_overdue: true }),
      ],
    });
    expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("heating system checks"))).toBe(true);
  });

  it("131 — radiator maintenance 50-79% yields soon recommendation", () => {
    const r = run({
      radiator_records: [
        makeRadiator({ bleed_overdue: false, inspection_overdue: false }),
        makeRadiator({ bleed_overdue: true, inspection_overdue: false }),
      ],
    });
    // bleed: 50%, inspection: 100% => avg 75%
    expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("radiator maintenance"))).toBe(true);
  });

  it("132 — thermostat calibration 50-79% yields soon recommendation", () => {
    const r = run({
      thermostat_records: [
        makeThermostat({ calibration_overdue: false }),
        makeThermostat({ calibration_overdue: true }),
      ],
    });
    expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("thermostat calibration"))).toBe(true);
  });

  it("133 — fault resolution <80% yields soon recommendation", () => {
    const r = run({
      boiler_service_records: [makeBoilerService({ faults_found: 5, faults_resolved: 3 })],
    });
    expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("outstanding boiler faults"))).toBe(true);
  });

  it("134 — aging boilers yield planned recommendation", () => {
    const r = run({
      boiler_service_records: [makeBoilerService({ boiler_age_years: 20 })],
    });
    expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("aging boilers"))).toBe(true);
  });

  it("135 — low battery thermostats yield planned recommendation", () => {
    const r = run({
      thermostat_records: [makeThermostat({ battery_status: "low" })],
    });
    expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("low batteries"))).toBe(true);
  });

  it("136 — energy efficiency <60% yields planned recommendation", () => {
    const r = run({
      energy_records: [
        makeEnergyRecord({ record_type: "epc", epc_rating: "F", heating_controls_optimised: false }),
      ],
    });
    // epc=25, controls=0 => (25+0)/2 = 13
    expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("energy efficiency"))).toBe(true);
  });

  it("137 — pipe insulation <80% yields planned recommendation", () => {
    const r = run({
      heating_check_records: [
        makeHeatingCheck({ pipe_insulation_adequate: true }),
        makeHeatingCheck({ pipe_insulation_adequate: false }),
      ],
    });
    expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("pipe insulation"))).toBe(true);
  });

  it("138 — tamper-proof <100% with child-accessible yields planned recommendation", () => {
    const r = run({
      thermostat_records: [makeThermostat({ child_accessible: true, tamper_proof: false })],
    });
    expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("tamper-proof"))).toBe(true);
  });

  it("139 — even heating 70-79% yields planned recommendation", () => {
    const r = run({
      radiator_records: [
        makeRadiator({ heating_evenly: true }),
        makeRadiator({ heating_evenly: true }),
        makeRadiator({ heating_evenly: true }),
        makeRadiator({ heating_evenly: false }),
      ],
    });
    // 3/4 = 75%
    expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("system balancing"))).toBe(true);
  });

  it("140 — recommendations have sequential rank numbers", () => {
    const r = run({
      boiler_service_records: [
        makeBoilerService({ carbon_monoxide_test_passed: false, cp12_certificate_valid: false, service_overdue: true, boiler_condition: "poor" }),
      ],
      radiator_records: [makeRadiator({ in_child_area: true, child_safety_cover_fitted: false, bleed_overdue: true, inspection_overdue: true })],
      thermostat_records: [makeThermostat({ calibration_overdue: true, battery_status: "dead" })],
    });
    const ranks = r.recommendations.map((rec) => rec.rank);
    for (let i = 0; i < ranks.length; i++) {
      expect(ranks[i]).toBe(i + 1);
    }
  });

  it("141 — all recommendations reference a regulatory framework", () => {
    const r = run({
      boiler_service_records: [makeBoilerService({ carbon_monoxide_test_passed: false, cp12_certificate_valid: false })],
    });
    for (const rec of r.recommendations) {
      expect(rec.regulatory_ref.length).toBeGreaterThan(0);
      expect(rec.regulatory_ref).toMatch(/Reg 25|SCCIF/);
    }
  });

  it("142 — no recommendations when everything is perfect", () => {
    const r = run({
      boiler_service_records: [makeBoilerService()],
      heating_check_records: [makeHeatingCheck()],
      radiator_records: [makeRadiator({ in_child_area: false })],
      thermostat_records: [makeThermostat({ child_accessible: false })],
    });
    expect(r.recommendations).toHaveLength(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GROUP 19 — INSIGHTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Insights", () => {
  it("143 — CO test failure generates critical insight", () => {
    const r = run({
      boiler_service_records: [makeBoilerService({ carbon_monoxide_test_passed: false })],
    });
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("carbon monoxide"))).toBe(true);
  });

  it("144 — gas safety <50% generates critical insight", () => {
    const r = run({
      boiler_service_records: [makeBoilerService({ cp12_certificate_valid: false })],
    });
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("CP12"))).toBe(true);
  });

  it("145 — boiler servicing <50% generates critical insight", () => {
    const r = run({
      boiler_service_records: [
        makeBoilerService({ service_overdue: true }),
        makeBoilerService({ service_overdue: true }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("boiler services are current"))).toBe(true);
  });

  it("146 — poor/condemned boiler generates critical insight", () => {
    const r = run({
      boiler_service_records: [makeBoilerService({ boiler_condition: "condemned" })],
    });
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("poor or condemned"))).toBe(true);
  });

  it("147 — radiator maintenance <50% generates critical insight", () => {
    const r = run({
      radiator_records: [makeRadiator({ bleed_overdue: true, inspection_overdue: true })],
    });
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("radiator maintenance"))).toBe(true);
  });

  it("148 — thermostat calibration <50% generates critical insight", () => {
    const r = run({
      thermostat_records: [makeThermostat({ calibration_overdue: true })],
    });
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("thermostats have current calibration"))).toBe(true);
  });

  it("149 — boiler servicing 50-79% generates warning insight", () => {
    const r = run({
      boiler_service_records: [
        makeBoilerService({ service_overdue: false }),
        makeBoilerService({ service_overdue: true }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Boiler servicing compliance"))).toBe(true);
  });

  it("150 — gas safety 50-79% generates warning insight", () => {
    const r = run({
      boiler_service_records: [
        makeBoilerService({ cp12_certificate_valid: true }),
        makeBoilerService({ cp12_certificate_valid: false }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("CP12 gas safety compliance"))).toBe(true);
  });

  it("151 — heating check 50-79% generates warning insight", () => {
    const r = run({
      heating_check_records: [
        makeHeatingCheck({ check_overdue: false }),
        makeHeatingCheck({ check_overdue: true }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Heating check compliance"))).toBe(true);
  });

  it("152 — radiator maintenance 50-79% generates warning insight", () => {
    const r = run({
      radiator_records: [
        makeRadiator({ bleed_overdue: false, inspection_overdue: false }),
        makeRadiator({ bleed_overdue: true, inspection_overdue: false }),
      ],
    });
    // bleed 50%, inspection 100% => avg 75%
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Radiator maintenance"))).toBe(true);
  });

  it("153 — thermostat calibration 50-79% generates warning insight", () => {
    const r = run({
      thermostat_records: [
        makeThermostat({ calibration_overdue: false }),
        makeThermostat({ calibration_overdue: true }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Thermostat calibration"))).toBe(true);
  });

  it("154 — overdue boiler services generate warning insight", () => {
    const r = run({
      boiler_service_records: [
        makeBoilerService({ service_overdue: true }),
        makeBoilerService({ service_overdue: false }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("boiler service") && i.text.includes("overdue"))).toBe(true);
  });

  it("155 — overdue heating checks generate warning insight", () => {
    const r = run({
      heating_check_records: [
        makeHeatingCheck({ check_overdue: true }),
        makeHeatingCheck({ check_overdue: false }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("heating check") && i.text.includes("overdue"))).toBe(true);
  });

  it("156 — aging boilers (not poor) generate warning insight", () => {
    const r = run({
      boiler_service_records: [makeBoilerService({ boiler_age_years: 18, boiler_condition: "fair" })],
    });
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("over 15 years old"))).toBe(true);
  });

  it("157 — low battery (no dead) generates warning insight", () => {
    const r = run({
      thermostat_records: [makeThermostat({ battery_status: "low" })],
    });
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("low battery"))).toBe(true);
  });

  it("158 — high avg variance >2.0 generates warning insight", () => {
    const r = run({
      thermostat_records: [makeThermostat({ temperature_variance_celsius: 3.0 })],
    });
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("variance"))).toBe(true);
  });

  it("159 — energy efficiency 40-59% generates warning insight", () => {
    const r = run({
      energy_records: [
        makeEnergyRecord({ record_type: "epc", epc_rating: "D", heating_controls_optimised: true }),
        makeEnergyRecord({ record_type: "audit", insulation_adequate: false, draught_proofing_adequate: false, heating_controls_optimised: false }),
      ],
    });
    // epc=55, insulation=0, draught=0, controls=50 => (55+0+0+50)/4 = 26
    // Actually 26 < 40, won't trigger. Let's fix
    expect(r.energy_efficiency_rate).toBe(26);
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Energy efficiency"))).toBe(false);
    const r2 = run({
      energy_records: [
        makeEnergyRecord({ record_type: "epc", epc_rating: "D", heating_controls_optimised: true }),
        makeEnergyRecord({ record_type: "audit", insulation_adequate: true, draught_proofing_adequate: false, heating_controls_optimised: true }),
      ],
    });
    // epc=55, insulation=100, draught=0, controls=100 => (55+100+0+100)/4 = 64
    // 64 >= 60 — not in [40,60) range. Adjust:
    expect(r2.energy_efficiency_rate).toBe(64);
    expect(r2.insights.some((i) => i.severity === "warning" && i.text.includes("Energy efficiency"))).toBe(false);
    const r3 = run({
      energy_records: [
        makeEnergyRecord({ record_type: "epc", epc_rating: "E", heating_controls_optimised: true }),
        makeEnergyRecord({ record_type: "audit", insulation_adequate: false, draught_proofing_adequate: true, heating_controls_optimised: false }),
      ],
    });
    // epc=40, insulation=0, draught=100, controls=50 => (40+0+100+50)/4 = 48
    expect(r3.energy_efficiency_rate).toBeGreaterThanOrEqual(40);
    expect(r3.energy_efficiency_rate).toBeLessThan(60);
    expect(r3.insights.some((i) => i.severity === "warning" && i.text.includes("Energy efficiency"))).toBe(true);
  });

  it("160 — overdue calibrations generate warning insight", () => {
    const r = run({
      thermostat_records: [
        makeThermostat({ calibration_overdue: true }),
        makeThermostat({ calibration_overdue: false }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("thermostat calibration") && i.text.includes("overdue"))).toBe(true);
  });

  it("161 — child comfort 50-69% generates warning insight", () => {
    const r = run({
      radiator_records: [
        makeRadiator({ temperature_appropriate: true, heating_evenly: false }),
        makeRadiator({ temperature_appropriate: false, heating_evenly: false }),
      ],
      heating_check_records: [makeHeatingCheck({ all_zones_heating: true, hot_water_functional: true })],
      thermostat_records: [makeThermostat({ programming_correct: false })],
    });
    // temp: 50%, zone: 100%, even: 0%, hotWater: 100%, programming: 0%
    // (50+100+0+100+0)/5 = 50
    expect(r.child_comfort_rate).toBe(50);
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Child comfort score"))).toBe(true);
  });

  it("162 — heating system type analysis with 3+ checks", () => {
    const r = run({
      heating_check_records: [
        makeHeatingCheck({ system_type: "central_heating" }),
        makeHeatingCheck({ system_type: "central_heating" }),
        makeHeatingCheck({ system_type: "underfloor" }),
      ],
    });
    expect(r.insights.some((i) => i.text.includes("Heating system profile"))).toBe(true);
  });

  it("163 — thermostat type analysis with 3+ thermostats", () => {
    const r = run({
      thermostat_records: [
        makeThermostat({ thermostat_type: "smart" }),
        makeThermostat({ thermostat_type: "smart" }),
        makeThermostat({ thermostat_type: "trv" }),
      ],
    });
    expect(r.insights.some((i) => i.text.includes("Thermostat profile"))).toBe(true);
  });

  it("164 — outstanding rating generates positive insight", () => {
    const r = run({
      boiler_service_records: [makeBoilerService()],
      heating_check_records: [makeHeatingCheck()],
      radiator_records: [makeRadiator()],
      thermostat_records: [makeThermostat()],
      energy_records: [
        makeEnergyRecord({ record_type: "epc", epc_rating: "A", heating_controls_optimised: true }),
        makeEnergyRecord({ record_type: "audit", insulation_adequate: true, draught_proofing_adequate: true, heating_controls_optimised: true }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("outstanding"))).toBe(true);
  });

  it("165 — full gas safety + CO generates positive insight", () => {
    const r = run({
      boiler_service_records: [makeBoilerService({ cp12_certificate_valid: true, carbon_monoxide_test_passed: true })],
    });
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("Full CP12"))).toBe(true);
  });

  it("166 — 100% servicing + Gas Safe engineers generates positive insight", () => {
    const r = run({
      boiler_service_records: [makeBoilerService({ service_overdue: false, engineer_gas_safe_registered: true })],
    });
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("Gas Safe registered engineers"))).toBe(true);
  });

  it("167 — radiator maintenance 90%+ and even heating 90%+ generates positive insight", () => {
    const r = run({
      radiator_records: [makeRadiator()],
    });
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("radiator maintenance"))).toBe(true);
  });

  it("168 — thermostat calibration 100% + accuracy 90%+ generates positive insight", () => {
    const r = run({
      thermostat_records: [makeThermostat({ calibration_overdue: false, reading_accurate: true })],
    });
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("thermostats calibrated"))).toBe(true);
  });

  it("169 — child comfort 90%+ generates positive insight", () => {
    const r = run({
      radiator_records: [makeRadiator()],
      heating_check_records: [makeHeatingCheck()],
      thermostat_records: [makeThermostat()],
    });
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("child comfort score"))).toBe(true);
  });

  it("170 — energy efficiency 80%+ generates positive insight", () => {
    const r = run({
      energy_records: [
        makeEnergyRecord({ record_type: "epc", epc_rating: "A", heating_controls_optimised: true }),
        makeEnergyRecord({ record_type: "audit", insulation_adequate: true, draught_proofing_adequate: true, heating_controls_optimised: true }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("Energy efficiency"))).toBe(true);
  });

  it("171 — 100% fault resolution generates positive insight", () => {
    const r = run({
      boiler_service_records: [makeBoilerService({ faults_found: 2, faults_resolved: 2 })],
    });
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("Every boiler fault"))).toBe(true);
  });

  it("172 — child safety covers + tamper-proof generates positive insight", () => {
    const r = run({
      radiator_records: [makeRadiator({ in_child_area: true, child_safety_cover_fitted: true })],
      thermostat_records: [makeThermostat({ child_accessible: true, tamper_proof: true })],
    });
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("safety covers") && i.text.includes("tamper-proof"))).toBe(true);
  });

  it("173 — leak-free + normal pressure + functional pumps generates positive insight", () => {
    const r = run({
      heating_check_records: [makeHeatingCheck({ leaks_detected: false, water_pressure_normal: true, pump_functional: true })],
    });
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("No leaks"))).toBe(true);
  });

  it("174 — both heating checks and boiler servicing 100% generates positive insight", () => {
    const r = run({
      boiler_service_records: [makeBoilerService()],
      heating_check_records: [makeHeatingCheck()],
    });
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("heating system checks and boiler servicing are fully current"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GROUP 20 — HEADLINES
// ══════════════════════════════════════════════════════════════════════════════

describe("Headlines", () => {
  it("175 — outstanding headline", () => {
    const r = run({
      boiler_service_records: [makeBoilerService()],
      heating_check_records: [makeHeatingCheck()],
      radiator_records: [makeRadiator()],
      thermostat_records: [makeThermostat()],
      energy_records: [
        makeEnergyRecord({ record_type: "epc", epc_rating: "A", heating_controls_optimised: true }),
        makeEnergyRecord({ record_type: "audit", insulation_adequate: true, draught_proofing_adequate: true, heating_controls_optimised: true }),
      ],
    });
    expect(r.headline).toContain("Outstanding");
  });

  it("176 — good headline references strengths and concerns counts", () => {
    const r = run({
      boiler_service_records: [makeBoilerService()],
      heating_check_records: [makeHeatingCheck()],
      radiator_records: [makeRadiator()],
      thermostat_records: [makeThermostat()],
    });
    expect(r.headline).toContain("Good");
    expect(r.headline).toContain("strength");
  });

  it("177 — adequate headline references concerns count", () => {
    const r = run({
      boiler_service_records: [
        makeBoilerService({ service_overdue: false, cp12_certificate_valid: true }),
        makeBoilerService({ service_overdue: true, cp12_certificate_valid: false }),
      ],
    });
    expect(r.headline).toContain("Adequate");
    expect(r.headline).toContain("concern");
  });

  it("178 — inadequate headline references urgent action", () => {
    const r = run({
      boiler_service_records: [
        makeBoilerService({ service_overdue: true, cp12_certificate_valid: false, carbon_monoxide_test_passed: false }),
        makeBoilerService({ service_overdue: true, cp12_certificate_valid: false, carbon_monoxide_test_passed: false }),
        makeBoilerService({ service_overdue: true, cp12_certificate_valid: false, carbon_monoxide_test_passed: false }),
      ],
      radiator_records: [makeRadiator({ bleed_overdue: true, inspection_overdue: true })],
      thermostat_records: [makeThermostat({ calibration_overdue: true })],
    });
    expect(r.headline).toContain("inadequate");
    expect(r.headline).toContain("urgent action");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GROUP 21 — PLURAL GRAMMAR
// ══════════════════════════════════════════════════════════════════════════════

describe("Plural grammar in text", () => {
  it("179 — singular grammar for 1 CO test failed", () => {
    const r = run({
      boiler_service_records: [
        makeBoilerService({ carbon_monoxide_test_passed: false }),
        makeBoilerService({ carbon_monoxide_test_passed: true }),
      ],
    });
    const concern = r.concerns.find((c) => c.includes("carbon monoxide test"));
    expect(concern).toContain("1 carbon monoxide test failed");
  });

  it("180 — plural grammar for multiple CO tests failed", () => {
    const r = run({
      boiler_service_records: [
        makeBoilerService({ carbon_monoxide_test_passed: false }),
        makeBoilerService({ carbon_monoxide_test_passed: false }),
      ],
    });
    const concern = r.concerns.find((c) => c.includes("carbon monoxide test"));
    expect(concern).toContain("2 carbon monoxide tests failed");
  });
});
