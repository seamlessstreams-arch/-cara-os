// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME BOILER & HEATING SYSTEM SERVICING INTELLIGENCE ENGINE
// Monitors annual boiler servicing, heating system checks, radiator bleeding
// schedules, thermostat calibration, and energy efficiency across the home.
// Ensures children live in a warm, safe, and properly maintained environment
// with fully serviced heating infrastructure that meets regulatory standards.
// Measures boiler servicing compliance, heating system check frequency,
// radiator maintenance schedules, thermostat calibration accuracy, energy
// efficiency, and child comfort outcomes.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 25 (Premises and safety — heating systems must be safe and
// well-maintained). SCCIF: "The premises and environment are safe, well
// maintained, and suitable for children."
// Store keys: boilerServiceRecords, heatingCheckRecords, radiatorRecords,
//             thermostatRecords, energyRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface BoilerServiceInput {
  id: string;
  boiler_id: string;
  service_date: string;
  engineer_name: string;
  engineer_gas_safe_registered: boolean;
  service_type: "annual" | "interim" | "emergency" | "installation";
  gas_safety_certificate_issued: boolean;
  cp12_certificate_valid: boolean;
  faults_found: number;
  faults_resolved: number;
  carbon_monoxide_test_passed: boolean;
  flue_inspection_passed: boolean;
  pressure_test_passed: boolean;
  next_service_due: string;
  service_overdue: boolean;
  boiler_age_years: number;
  boiler_condition: "excellent" | "good" | "fair" | "poor" | "condemned";
  notes_recorded: boolean;
  created_at: string;
}

export interface HeatingCheckInput {
  id: string;
  check_date: string;
  checker_name: string;
  check_type: "routine" | "seasonal" | "post_repair" | "commissioning";
  system_type: "central_heating" | "underfloor" | "storage_heater" | "heat_pump" | "mixed";
  all_zones_heating: boolean;
  hot_water_functional: boolean;
  timer_programmer_working: boolean;
  pipe_insulation_adequate: boolean;
  expansion_vessel_ok: boolean;
  pump_functional: boolean;
  water_pressure_normal: boolean;
  leaks_detected: boolean;
  issues_found: number;
  issues_resolved: number;
  next_check_due: string;
  check_overdue: boolean;
  notes_recorded: boolean;
  created_at: string;
}

export interface RadiatorRecordInput {
  id: string;
  location: string;
  radiator_type: "panel" | "column" | "convector" | "towel_rail" | "other";
  last_bleed_date: string | null;
  bleed_due_date: string | null;
  bleed_overdue: boolean;
  heating_evenly: boolean;
  thermostat_valve_working: boolean;
  condition: "excellent" | "good" | "fair" | "poor" | "replaced";
  child_safety_cover_fitted: boolean;
  temperature_appropriate: boolean;
  last_inspection_date: string | null;
  inspection_overdue: boolean;
  in_child_area: boolean;
  notes_recorded: boolean;
  created_at: string;
}

export interface ThermostatRecordInput {
  id: string;
  location: string;
  thermostat_type: "room" | "trv" | "smart" | "programmable" | "cylinder";
  last_calibration_date: string | null;
  calibration_due_date: string | null;
  calibration_overdue: boolean;
  reading_accurate: boolean;
  temperature_variance_celsius: number;
  battery_status: "good" | "low" | "dead" | "mains_powered";
  child_accessible: boolean;
  tamper_proof: boolean;
  set_temperature_celsius: number;
  actual_temperature_celsius: number;
  programming_correct: boolean;
  last_check_date: string | null;
  check_overdue: boolean;
  notes_recorded: boolean;
  created_at: string;
}

export interface EnergyRecordInput {
  id: string;
  record_date: string;
  record_type: "epc" | "meter_reading" | "audit" | "improvement" | "assessment";
  epc_rating: "A" | "B" | "C" | "D" | "E" | "F" | "G" | null;
  energy_consumption_kwh: number | null;
  cost_gbp: number | null;
  efficiency_measure_type: string | null;
  efficiency_measure_implemented: boolean;
  improvement_description: string | null;
  estimated_saving_percent: number | null;
  actual_saving_percent: number | null;
  insulation_adequate: boolean;
  draught_proofing_adequate: boolean;
  window_condition: "good" | "fair" | "poor" | null;
  heating_controls_optimised: boolean;
  notes_recorded: boolean;
  created_at: string;
}

export interface BoilerHeatingSystemServicingInput {
  today: string;
  total_children: number;
  boiler_service_records: BoilerServiceInput[];
  heating_check_records: HeatingCheckInput[];
  radiator_records: RadiatorRecordInput[];
  thermostat_records: ThermostatRecordInput[];
  energy_records: EnergyRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type BoilerHeatingRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface BoilerHeatingInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface BoilerHeatingRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface BoilerHeatingSystemServicingResult {
  boiler_rating: BoilerHeatingRating;
  boiler_score: number;
  headline: string;
  total_boiler_services: number;
  total_heating_checks: number;
  total_radiators: number;
  total_thermostats: number;
  total_energy_records: number;
  boiler_servicing_rate: number;
  heating_check_rate: number;
  radiator_maintenance_rate: number;
  thermostat_calibration_rate: number;
  energy_efficiency_rate: number;
  child_comfort_rate: number;
  gas_safety_compliance_rate: number;
  carbon_monoxide_safety_rate: number;
  fault_resolution_rate: number;
  boiler_condition_score: number;
  strengths: string[];
  concerns: string[];
  recommendations: BoilerHeatingRecommendation[];
  insights: BoilerHeatingInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): BoilerHeatingRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: BoilerHeatingRating,
  score: number,
  headline: string,
): BoilerHeatingSystemServicingResult {
  return {
    boiler_rating: rating,
    boiler_score: score,
    headline,
    total_boiler_services: 0,
    total_heating_checks: 0,
    total_radiators: 0,
    total_thermostats: 0,
    total_energy_records: 0,
    boiler_servicing_rate: 0,
    heating_check_rate: 0,
    radiator_maintenance_rate: 0,
    thermostat_calibration_rate: 0,
    energy_efficiency_rate: 0,
    child_comfort_rate: 0,
    gas_safety_compliance_rate: 0,
    carbon_monoxide_safety_rate: 0,
    fault_resolution_rate: 0,
    boiler_condition_score: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeBoilerHeatingSystemServicing(
  input: BoilerHeatingSystemServicingInput,
): BoilerHeatingSystemServicingResult {
  const {
    total_children,
    boiler_service_records,
    heating_check_records,
    radiator_records,
    thermostat_records,
    energy_records,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    boiler_service_records.length === 0 &&
    heating_check_records.length === 0 &&
    radiator_records.length === 0 &&
    thermostat_records.length === 0 &&
    energy_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess boiler and heating system servicing.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No boiler servicing, heating check, radiator, thermostat, or energy records exist despite children on placement — heating system safety and maintenance require urgent attention.",
      ),
      concerns: [
        "No boiler service records, heating checks, radiator maintenance records, thermostat calibration data, or energy efficiency records exist despite children being on placement — the home cannot evidence safe and well-maintained heating infrastructure.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Arrange an immediate annual boiler service by a Gas Safe registered engineer — all gas appliances must have a current CP12 gas safety certificate to ensure children's safety and legal compliance.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
        },
        {
          rank: 2,
          recommendation:
            "Implement a comprehensive heating system maintenance programme covering boiler servicing, radiator bleeding, thermostat calibration, and energy efficiency to ensure children live in a warm, safe, and well-maintained environment.",
          urgency: "immediate",
          regulatory_ref: "SCCIF — Premises safe, well maintained, suitable",
        },
      ],
      insights: [
        {
          text: "The complete absence of boiler and heating system records means the home cannot demonstrate that heating infrastructure is safe, legally compliant, or properly maintained. A valid CP12 gas safety certificate is a legal requirement, and the absence of any boiler servicing evidence represents a critical safety and compliance failure under Reg 25.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  const totalBoilerServices = boiler_service_records.length;
  const totalHeatingChecks = heating_check_records.length;
  const totalRadiators = radiator_records.length;
  const totalThermostats = thermostat_records.length;
  const totalEnergyRecords = energy_records.length;

  // ─── Boiler servicing rate ────────────────────────────────────────────
  // Measures: proportion of boiler services that are current (not overdue)
  const currentBoilerServices = boiler_service_records.filter(
    (s) => !s.service_overdue,
  ).length;
  const boilerServicingRate = pct(currentBoilerServices, totalBoilerServices);

  // Gas safety compliance: CP12 certificates valid
  const cp12Valid = boiler_service_records.filter(
    (s) => s.cp12_certificate_valid,
  ).length;
  const gasSafetyComplianceRate = pct(cp12Valid, totalBoilerServices);

  // Gas Safe registered engineers
  const gasSafeEngineers = boiler_service_records.filter(
    (s) => s.engineer_gas_safe_registered,
  ).length;
  const gasSafeEngineerRate = pct(gasSafeEngineers, totalBoilerServices);

  // Carbon monoxide safety
  const coTestsPassed = boiler_service_records.filter(
    (s) => s.carbon_monoxide_test_passed,
  ).length;
  const carbonMonoxideSafetyRate = pct(coTestsPassed, totalBoilerServices);

  // Flue inspection pass rate
  const fluesPassed = boiler_service_records.filter(
    (s) => s.flue_inspection_passed,
  ).length;
  const flueInspectionRate = pct(fluesPassed, totalBoilerServices);

  // Pressure test pass rate
  const pressureTestsPassed = boiler_service_records.filter(
    (s) => s.pressure_test_passed,
  ).length;
  const pressureTestRate = pct(pressureTestsPassed, totalBoilerServices);

  // Gas safety certificate issuance
  const gasSafetyCertificatesIssued = boiler_service_records.filter(
    (s) => s.gas_safety_certificate_issued,
  ).length;
  const gasSafetyCertificateRate = pct(gasSafetyCertificatesIssued, totalBoilerServices);

  // Fault resolution
  const totalFaultsFound = boiler_service_records.reduce(
    (sum, s) => sum + s.faults_found,
    0,
  );
  const totalFaultsResolved = boiler_service_records.reduce(
    (sum, s) => sum + s.faults_resolved,
    0,
  );
  const faultResolutionRate = pct(totalFaultsResolved, totalFaultsFound);

  // Boiler condition scoring
  const conditionMap: Record<string, number> = {
    excellent: 100,
    good: 80,
    fair: 60,
    poor: 30,
    condemned: 0,
  };
  const conditionScores = boiler_service_records.map(
    (s) => conditionMap[s.boiler_condition] ?? 50,
  );
  const boilerConditionScore =
    conditionScores.length > 0
      ? Math.round(
          conditionScores.reduce((sum, v) => sum + v, 0) /
            conditionScores.length,
        )
      : 0;

  // Boiler services with notes
  const boilerServicesWithNotes = boiler_service_records.filter(
    (s) => s.notes_recorded,
  ).length;
  const boilerDocumentationRate = pct(boilerServicesWithNotes, totalBoilerServices);

  // Overdue services count
  const overdueBoilerServices = boiler_service_records.filter(
    (s) => s.service_overdue,
  ).length;

  // Boilers in poor/condemned condition
  const poorConditionBoilers = boiler_service_records.filter(
    (s) => s.boiler_condition === "poor" || s.boiler_condition === "condemned",
  ).length;

  // Old boilers (>15 years)
  const agingBoilers = boiler_service_records.filter(
    (s) => s.boiler_age_years > 15,
  ).length;

  // CO tests failed
  const coTestsFailed = boiler_service_records.filter(
    (s) => !s.carbon_monoxide_test_passed,
  ).length;

  // ─── Heating check rate ───────────────────────────────────────────────
  // Measures: proportion of heating checks that are current (not overdue)
  const currentHeatingChecks = heating_check_records.filter(
    (c) => !c.check_overdue,
  ).length;
  const heatingCheckRate = pct(currentHeatingChecks, totalHeatingChecks);

  // All zones heating properly
  const allZonesHeating = heating_check_records.filter(
    (c) => c.all_zones_heating,
  ).length;
  const zoneHeatingRate = pct(allZonesHeating, totalHeatingChecks);

  // Hot water functional
  const hotWaterFunctional = heating_check_records.filter(
    (c) => c.hot_water_functional,
  ).length;
  const hotWaterRate = pct(hotWaterFunctional, totalHeatingChecks);

  // Leaks detected
  const checksWithLeaks = heating_check_records.filter(
    (c) => c.leaks_detected,
  ).length;
  const leakFreeRate = pct(totalHeatingChecks - checksWithLeaks, totalHeatingChecks);

  // Issue resolution in heating checks
  const heatingIssuesFound = heating_check_records.reduce(
    (sum, c) => sum + c.issues_found,
    0,
  );
  const heatingIssuesResolved = heating_check_records.reduce(
    (sum, c) => sum + c.issues_resolved,
    0,
  );
  const heatingIssueResolutionRate = pct(heatingIssuesResolved, heatingIssuesFound);

  // Overdue heating checks
  const overdueHeatingChecks = heating_check_records.filter(
    (c) => c.check_overdue,
  ).length;

  // Pipe insulation adequacy
  const pipeInsulationAdequate = heating_check_records.filter(
    (c) => c.pipe_insulation_adequate,
  ).length;
  const pipeInsulationRate = pct(pipeInsulationAdequate, totalHeatingChecks);

  // Heating check documentation
  const heatingChecksWithNotes = heating_check_records.filter(
    (c) => c.notes_recorded,
  ).length;
  const heatingDocumentationRate = pct(heatingChecksWithNotes, totalHeatingChecks);

  // Pump functional
  const pumpsFunctional = heating_check_records.filter(
    (c) => c.pump_functional,
  ).length;
  const pumpFunctionalRate = pct(pumpsFunctional, totalHeatingChecks);

  // Water pressure normal
  const waterPressureNormal = heating_check_records.filter(
    (c) => c.water_pressure_normal,
  ).length;
  const waterPressureRate = pct(waterPressureNormal, totalHeatingChecks);

  // Timer/programmer working
  const timerProgrammerWorking = heating_check_records.filter(
    (c) => c.timer_programmer_working,
  ).length;
  const timerProgrammerRate = pct(timerProgrammerWorking, totalHeatingChecks);

  // ─── Radiator maintenance rate ────────────────────────────────────────
  // Measures: proportion of radiators not overdue for bleeding/inspection
  const radiatorsNotOverdueBleed = radiator_records.filter(
    (r) => !r.bleed_overdue,
  ).length;
  const radiatorsNotOverdueInspection = radiator_records.filter(
    (r) => !r.inspection_overdue,
  ).length;
  const radiatorBleedRate = pct(radiatorsNotOverdueBleed, totalRadiators);
  const radiatorInspectionRate = pct(radiatorsNotOverdueInspection, totalRadiators);
  const radiatorMaintenanceRate =
    totalRadiators > 0
      ? Math.round((radiatorBleedRate + radiatorInspectionRate) / 2)
      : 0;

  // Radiators heating evenly
  const radiatorsHeatingEvenly = radiator_records.filter(
    (r) => r.heating_evenly,
  ).length;
  const evenHeatingRate = pct(radiatorsHeatingEvenly, totalRadiators);

  // TRV valves working
  const trvsWorking = radiator_records.filter(
    (r) => r.thermostat_valve_working,
  ).length;
  const trvWorkingRate = pct(trvsWorking, totalRadiators);

  // Child safety covers in child areas
  const radiatorsInChildAreas = radiator_records.filter(
    (r) => r.in_child_area,
  ).length;
  const childAreaRadiatorsWithCovers = radiator_records.filter(
    (r) => r.in_child_area && r.child_safety_cover_fitted,
  ).length;
  const childSafetyCoverRate = pct(childAreaRadiatorsWithCovers, radiatorsInChildAreas);

  // Temperature appropriate
  const radiatorsTemperatureOk = radiator_records.filter(
    (r) => r.temperature_appropriate,
  ).length;
  const radiatorTemperatureRate = pct(radiatorsTemperatureOk, totalRadiators);

  // Radiator condition
  const poorConditionRadiators = radiator_records.filter(
    (r) => r.condition === "poor",
  ).length;

  // Overdue radiator bleeds and inspections
  const overdueRadiatorBleeds = radiator_records.filter(
    (r) => r.bleed_overdue,
  ).length;
  const overdueRadiatorInspections = radiator_records.filter(
    (r) => r.inspection_overdue,
  ).length;

  // Radiator documentation
  const radiatorsWithNotes = radiator_records.filter(
    (r) => r.notes_recorded,
  ).length;
  const radiatorDocumentationRate = pct(radiatorsWithNotes, totalRadiators);

  // ─── Thermostat calibration rate ──────────────────────────────────────
  // Measures: proportion of thermostats not overdue for calibration
  const thermostatsNotOverdueCalibration = thermostat_records.filter(
    (t) => !t.calibration_overdue,
  ).length;
  const thermostatCalibrationRate = pct(thermostatsNotOverdueCalibration, totalThermostats);

  // Reading accuracy
  const thermostatsAccurate = thermostat_records.filter(
    (t) => t.reading_accurate,
  ).length;
  const thermostatAccuracyRate = pct(thermostatsAccurate, totalThermostats);

  // Temperature variance analysis
  const varianceValues = thermostat_records.map(
    (t) => Math.abs(t.temperature_variance_celsius),
  );
  const avgVariance =
    varianceValues.length > 0
      ? Math.round(
          (varianceValues.reduce((sum, v) => sum + v, 0) /
            varianceValues.length) *
            100,
        ) / 100
      : 0;

  // Battery status
  const thermostatsBatteryOk = thermostat_records.filter(
    (t) => t.battery_status === "good" || t.battery_status === "mains_powered",
  ).length;
  const batteryHealthRate = pct(thermostatsBatteryOk, totalThermostats);

  // Dead batteries
  const deadBatteryThermostats = thermostat_records.filter(
    (t) => t.battery_status === "dead",
  ).length;

  // Low batteries
  const lowBatteryThermostats = thermostat_records.filter(
    (t) => t.battery_status === "low",
  ).length;

  // Tamper-proof in child-accessible locations
  const childAccessibleThermostats = thermostat_records.filter(
    (t) => t.child_accessible,
  ).length;
  const tamperProofChildAccessible = thermostat_records.filter(
    (t) => t.child_accessible && t.tamper_proof,
  ).length;
  const tamperProofRate = pct(tamperProofChildAccessible, childAccessibleThermostats);

  // Programming correct
  const programmingCorrect = thermostat_records.filter(
    (t) => t.programming_correct,
  ).length;
  const programmingCorrectRate = pct(programmingCorrect, totalThermostats);

  // Overdue calibrations
  const overdueCalibrations = thermostat_records.filter(
    (t) => t.calibration_overdue,
  ).length;

  // Overdue thermostat checks
  const overdueChecks = thermostat_records.filter(
    (t) => t.check_overdue,
  ).length;

  // Temperature set point analysis
  const setTemperatures = thermostat_records
    .filter((t) => t.set_temperature_celsius > 0)
    .map((t) => t.set_temperature_celsius);
  const avgSetTemperature =
    setTemperatures.length > 0
      ? Math.round(
          (setTemperatures.reduce((sum, v) => sum + v, 0) /
            setTemperatures.length) *
            10,
        ) / 10
      : 0;

  // Thermostat documentation
  const thermostatsWithNotes = thermostat_records.filter(
    (t) => t.notes_recorded,
  ).length;
  const thermostatDocumentationRate = pct(thermostatsWithNotes, totalThermostats);

  // ─── Energy efficiency rate ───────────────────────────────────────────
  // Measures: composite of EPC, insulation, efficiency measures, controls
  const epcRecords = energy_records.filter((e) => e.record_type === "epc");
  const epcRatingMap: Record<string, number> = {
    A: 100,
    B: 85,
    C: 70,
    D: 55,
    E: 40,
    F: 25,
    G: 10,
  };
  const latestEpc = epcRecords.length > 0 ? epcRecords[epcRecords.length - 1] : null;
  const epcScore = latestEpc && latestEpc.epc_rating
    ? epcRatingMap[latestEpc.epc_rating] ?? 0
    : 0;

  // Insulation adequacy from all records
  const recordsWithInsulation = energy_records.filter(
    (e) => e.record_type === "audit" || e.record_type === "assessment",
  );
  const insulationAdequateCount = recordsWithInsulation.filter(
    (e) => e.insulation_adequate,
  ).length;
  const insulationRate = pct(insulationAdequateCount, recordsWithInsulation.length);

  // Draught proofing adequacy
  const draughtProofingAdequateCount = recordsWithInsulation.filter(
    (e) => e.draught_proofing_adequate,
  ).length;
  const draughtProofingRate = pct(draughtProofingAdequateCount, recordsWithInsulation.length);

  // Heating controls optimised
  const controlsOptimised = energy_records.filter(
    (e) => e.heating_controls_optimised,
  ).length;
  const controlsOptimisedRate = pct(controlsOptimised, totalEnergyRecords);

  // Efficiency measures implemented
  const improvementRecords = energy_records.filter(
    (e) => e.record_type === "improvement",
  );
  const measuresImplemented = improvementRecords.filter(
    (e) => e.efficiency_measure_implemented,
  ).length;
  const measureImplementationRate = pct(measuresImplemented, improvementRecords.length);

  // Window condition
  const windowRecords = energy_records.filter(
    (e) => e.window_condition !== null,
  );
  const goodWindows = windowRecords.filter(
    (e) => e.window_condition === "good",
  ).length;
  const windowConditionRate = pct(goodWindows, windowRecords.length);

  // Composite energy efficiency rate
  const energyComponentScores: number[] = [];
  if (latestEpc) energyComponentScores.push(epcScore);
  if (recordsWithInsulation.length > 0) energyComponentScores.push(insulationRate);
  if (recordsWithInsulation.length > 0) energyComponentScores.push(draughtProofingRate);
  if (totalEnergyRecords > 0) energyComponentScores.push(controlsOptimisedRate);
  const energyEfficiencyRate =
    energyComponentScores.length > 0
      ? Math.round(
          energyComponentScores.reduce((sum, v) => sum + v, 0) /
            energyComponentScores.length,
        )
      : 0;

  // Energy documentation
  const energyWithNotes = energy_records.filter(
    (e) => e.notes_recorded,
  ).length;
  const energyDocumentationRate = pct(energyWithNotes, totalEnergyRecords);

  // ─── Child comfort rate ───────────────────────────────────────────────
  // Composite: temperature appropriate, all zones heating, even heating,
  // hot water functional, programming correct
  const comfortComponents: number[] = [];
  if (totalRadiators > 0) comfortComponents.push(radiatorTemperatureRate);
  if (totalHeatingChecks > 0) comfortComponents.push(zoneHeatingRate);
  if (totalRadiators > 0) comfortComponents.push(evenHeatingRate);
  if (totalHeatingChecks > 0) comfortComponents.push(hotWaterRate);
  if (totalThermostats > 0) comfortComponents.push(programmingCorrectRate);
  const childComfortRate =
    comfortComponents.length > 0
      ? Math.round(
          comfortComponents.reduce((sum, v) => sum + v, 0) /
            comfortComponents.length,
        )
      : 0;

  // ── Scoring: base 52 ─────────────────────────────────────────────────

  let score = 52;

  // --- Bonus 1: boilerServicingRate (>=100: +5, >=80: +3) ---
  if (boilerServicingRate >= 100) score += 5;
  else if (boilerServicingRate >= 80) score += 3;

  // --- Bonus 2: heatingCheckRate (>=100: +4, >=80: +2) ---
  if (heatingCheckRate >= 100) score += 4;
  else if (heatingCheckRate >= 80) score += 2;

  // --- Bonus 3: radiatorMaintenanceRate (>=90: +4, >=70: +2) ---
  if (radiatorMaintenanceRate >= 90) score += 4;
  else if (radiatorMaintenanceRate >= 70) score += 2;

  // --- Bonus 4: thermostatCalibrationRate (>=100: +4, >=80: +2) ---
  if (thermostatCalibrationRate >= 100) score += 4;
  else if (thermostatCalibrationRate >= 80) score += 2;

  // --- Bonus 5: energyEfficiencyRate (>=80: +4, >=60: +2) ---
  if (energyEfficiencyRate >= 80) score += 4;
  else if (energyEfficiencyRate >= 60) score += 2;

  // --- Bonus 6: gasSafetyComplianceRate (>=100: +3, >=80: +1) ---
  if (gasSafetyComplianceRate >= 100) score += 3;
  else if (gasSafetyComplianceRate >= 80) score += 1;

  // --- Bonus 7: carbonMonoxideSafetyRate (>=100: +2, >=90: +1) ---
  if (carbonMonoxideSafetyRate >= 100) score += 2;
  else if (carbonMonoxideSafetyRate >= 90) score += 1;

  // --- Bonus 8: childComfortRate (>=90: +2, >=70: +1) ---
  if (childComfortRate >= 90) score += 2;
  else if (childComfortRate >= 70) score += 1;

  // Max bonuses: 5+4+4+4+4+3+2+2 = 28

  // ── Penalties (4 guarded) ─────────────────────────────────────────────

  // Penalty 1: boilerServicingRate < 50 → -6
  if (boilerServicingRate < 50 && totalBoilerServices > 0) score -= 6;

  // Penalty 2: gasSafetyComplianceRate < 50 → -6
  if (gasSafetyComplianceRate < 50 && totalBoilerServices > 0) score -= 6;

  // Penalty 3: radiatorMaintenanceRate < 50 → -4
  if (radiatorMaintenanceRate < 50 && totalRadiators > 0) score -= 4;

  // Penalty 4: thermostatCalibrationRate < 50 → -4
  if (thermostatCalibrationRate < 50 && totalThermostats > 0) score -= 4;

  score = clamp(score, 0, 100);

  const boiler_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (boilerServicingRate >= 100 && totalBoilerServices > 0) {
    strengths.push(
      "All boiler services are up to date — the home maintains full compliance with annual servicing requirements, ensuring gas safety and reliable heating for children.",
    );
  } else if (boilerServicingRate >= 80 && totalBoilerServices > 0) {
    strengths.push(
      `${boilerServicingRate}% boiler servicing compliance — strong maintenance of annual servicing schedules for heating equipment.`,
    );
  }

  if (gasSafetyComplianceRate >= 100 && totalBoilerServices > 0) {
    strengths.push(
      "All CP12 gas safety certificates are valid — the home demonstrates full legal compliance with gas safety regulations, a fundamental safety requirement for children's premises.",
    );
  } else if (gasSafetyComplianceRate >= 80 && totalBoilerServices > 0) {
    strengths.push(
      `${gasSafetyComplianceRate}% CP12 gas safety compliance — strong evidence of commitment to gas safety standards.`,
    );
  }

  if (carbonMonoxideSafetyRate >= 100 && totalBoilerServices > 0) {
    strengths.push(
      "All carbon monoxide tests passed — children are protected from the risk of carbon monoxide poisoning through rigorous testing at every service.",
    );
  } else if (carbonMonoxideSafetyRate >= 90 && totalBoilerServices > 0) {
    strengths.push(
      `${carbonMonoxideSafetyRate}% carbon monoxide test pass rate — the home maintains high standards of CO safety testing.`,
    );
  }

  if (heatingCheckRate >= 100 && totalHeatingChecks > 0) {
    strengths.push(
      "All heating system checks are current — the home proactively monitors its heating infrastructure to prevent breakdowns and ensure consistent warmth.",
    );
  } else if (heatingCheckRate >= 80 && totalHeatingChecks > 0) {
    strengths.push(
      `${heatingCheckRate}% heating check compliance — the home maintains a strong schedule of heating system inspections.`,
    );
  }

  if (radiatorMaintenanceRate >= 90 && totalRadiators > 0) {
    strengths.push(
      `${radiatorMaintenanceRate}% radiator maintenance compliance — radiators are regularly bled and inspected, ensuring efficient heat distribution throughout the home.`,
    );
  } else if (radiatorMaintenanceRate >= 70 && totalRadiators > 0) {
    strengths.push(
      `${radiatorMaintenanceRate}% radiator maintenance rate — the home generally keeps radiators well-maintained.`,
    );
  }

  if (thermostatCalibrationRate >= 100 && totalThermostats > 0) {
    strengths.push(
      "All thermostats are calibrated and current — accurate temperature control ensures children's living spaces are maintained at appropriate and comfortable temperatures.",
    );
  } else if (thermostatCalibrationRate >= 80 && totalThermostats > 0) {
    strengths.push(
      `${thermostatCalibrationRate}% thermostat calibration compliance — the majority of temperature controls are accurately calibrated.`,
    );
  }

  if (energyEfficiencyRate >= 80 && energyComponentScores.length > 0) {
    strengths.push(
      `Energy efficiency score of ${energyEfficiencyRate}% — the home demonstrates strong energy efficiency practices, contributing to environmental responsibility and cost-effective heating.`,
    );
  } else if (energyEfficiencyRate >= 60 && energyComponentScores.length > 0) {
    strengths.push(
      `Energy efficiency at ${energyEfficiencyRate}% — the home shows reasonable energy efficiency with room for further improvement.`,
    );
  }

  if (childComfortRate >= 90 && comfortComponents.length > 0) {
    strengths.push(
      `${childComfortRate}% child comfort score — children experience consistently warm, well-heated living spaces with reliable hot water and appropriate temperature settings.`,
    );
  } else if (childComfortRate >= 70 && comfortComponents.length > 0) {
    strengths.push(
      `${childComfortRate}% child comfort rate — the heating system generally provides good levels of comfort for children.`,
    );
  }

  if (faultResolutionRate >= 100 && totalFaultsFound > 0) {
    strengths.push(
      "All boiler faults identified during servicing have been resolved — the home demonstrates responsive maintenance, ensuring no outstanding defects affect children's safety or comfort.",
    );
  } else if (faultResolutionRate >= 80 && totalFaultsFound > 0) {
    strengths.push(
      `${faultResolutionRate}% fault resolution rate — the majority of boiler faults are addressed promptly.`,
    );
  }

  if (gasSafeEngineerRate >= 100 && totalBoilerServices > 0) {
    strengths.push(
      "All boiler services conducted by Gas Safe registered engineers — the home ensures only qualified professionals service gas appliances, in line with legal requirements.",
    );
  }

  if (childSafetyCoverRate >= 100 && radiatorsInChildAreas > 0) {
    strengths.push(
      "All radiators in children's areas have safety covers fitted — the home protects children from contact burns and radiator-related injuries.",
    );
  } else if (childSafetyCoverRate >= 80 && radiatorsInChildAreas > 0) {
    strengths.push(
      `${childSafetyCoverRate}% of radiators in children's areas have safety covers — good practice in protecting children from burn risks.`,
    );
  }

  if (evenHeatingRate >= 90 && totalRadiators > 0) {
    strengths.push(
      `${evenHeatingRate}% of radiators heating evenly — efficient heat distribution ensures consistent warmth throughout the home.`,
    );
  }

  if (leakFreeRate >= 100 && totalHeatingChecks > 0) {
    strengths.push(
      "No leaks detected in any heating system check — the system maintains full integrity, preventing water damage and ensuring efficient operation.",
    );
  }

  if (batteryHealthRate >= 100 && totalThermostats > 0) {
    strengths.push(
      "All thermostat batteries are in good condition or mains-powered — reliable power ensures continuous and accurate temperature control.",
    );
  }

  if (tamperProofRate >= 100 && childAccessibleThermostats > 0) {
    strengths.push(
      "All child-accessible thermostats are tamper-proof — children are protected from inadvertently changing temperature settings.",
    );
  }

  if (pipeInsulationRate >= 100 && totalHeatingChecks > 0) {
    strengths.push(
      "All pipe insulation rated adequate — properly insulated pipes improve energy efficiency and reduce heat loss throughout the system.",
    );
  }

  if (flueInspectionRate >= 100 && totalBoilerServices > 0) {
    strengths.push(
      "All flue inspections passed — safe flue operation is critical for preventing harmful gas emissions within the home.",
    );
  }

  if (boilerDocumentationRate >= 90 && totalBoilerServices > 0) {
    strengths.push(
      `${boilerDocumentationRate}% of boiler services have documented notes — comprehensive recording supports evidence of regulatory compliance and maintenance history.`,
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (boilerServicingRate < 50 && totalBoilerServices > 0) {
    concerns.push(
      `Only ${boilerServicingRate}% of boiler services are current — the majority of boiler servicing is overdue, creating significant safety risks and legal compliance failures.`,
    );
  } else if (boilerServicingRate < 80 && boilerServicingRate >= 50 && totalBoilerServices > 0) {
    concerns.push(
      `Boiler servicing compliance at ${boilerServicingRate}% — some boiler services are overdue, which may compromise the safety and reliability of heating equipment.`,
    );
  }

  if (gasSafetyComplianceRate < 50 && totalBoilerServices > 0) {
    concerns.push(
      `Only ${gasSafetyComplianceRate}% of CP12 gas safety certificates are valid — the home is operating gas appliances without current safety certification, which is a legal requirement and critical safety concern.`,
    );
  } else if (gasSafetyComplianceRate < 80 && gasSafetyComplianceRate >= 50 && totalBoilerServices > 0) {
    concerns.push(
      `CP12 gas safety compliance at ${gasSafetyComplianceRate}% — some gas safety certificates have lapsed, which must be addressed to maintain legal compliance.`,
    );
  }

  if (coTestsFailed > 0 && totalBoilerServices > 0) {
    concerns.push(
      `${coTestsFailed} carbon monoxide test${coTestsFailed !== 1 ? "s" : ""} failed during boiler servicing — carbon monoxide is a lethal gas and any failed test represents an immediate danger to children's lives.`,
    );
  }

  if (heatingCheckRate < 50 && totalHeatingChecks > 0) {
    concerns.push(
      `Only ${heatingCheckRate}% of heating checks are current — the majority of system checks are overdue, increasing the risk of undetected faults and heating failures.`,
    );
  } else if (heatingCheckRate < 80 && heatingCheckRate >= 50 && totalHeatingChecks > 0) {
    concerns.push(
      `Heating check compliance at ${heatingCheckRate}% — some checks are overdue, potentially allowing heating issues to go undetected.`,
    );
  }

  if (radiatorMaintenanceRate < 50 && totalRadiators > 0) {
    concerns.push(
      `Only ${radiatorMaintenanceRate}% radiator maintenance compliance — the majority of radiators have overdue bleeding or inspections, leading to inefficient heating and potential cold spots in children's living areas.`,
    );
  } else if (radiatorMaintenanceRate < 80 && radiatorMaintenanceRate >= 50 && totalRadiators > 0) {
    concerns.push(
      `Radiator maintenance at ${radiatorMaintenanceRate}% — some radiators need bleeding or inspection, which may affect heat distribution.`,
    );
  }

  if (thermostatCalibrationRate < 50 && totalThermostats > 0) {
    concerns.push(
      `Only ${thermostatCalibrationRate}% of thermostats have current calibration — inaccurate temperature controls mean children's spaces may not be maintained at safe and comfortable temperatures.`,
    );
  } else if (thermostatCalibrationRate < 80 && thermostatCalibrationRate >= 50 && totalThermostats > 0) {
    concerns.push(
      `Thermostat calibration at ${thermostatCalibrationRate}% — some thermostats are overdue for calibration, which may result in inaccurate temperature regulation.`,
    );
  }

  if (poorConditionBoilers > 0 && totalBoilerServices > 0) {
    concerns.push(
      `${poorConditionBoilers} boiler${poorConditionBoilers !== 1 ? "s are" : " is"} in poor or condemned condition — boilers in this state pose safety risks and may fail without warning, leaving children without heating.`,
    );
  }

  if (agingBoilers > 0 && totalBoilerServices > 0) {
    concerns.push(
      `${agingBoilers} boiler${agingBoilers !== 1 ? "s are" : " is"} over 15 years old — aging boilers are less efficient, more prone to breakdown, and may lack modern safety features.`,
    );
  }

  if (overdueBoilerServices > 0 && totalBoilerServices > 0) {
    concerns.push(
      `${overdueBoilerServices} boiler service${overdueBoilerServices !== 1 ? "s are" : " is"} overdue — without timely servicing, boilers cannot be confirmed as safe to operate.`,
    );
  }

  if (checksWithLeaks > 0 && totalHeatingChecks > 0) {
    concerns.push(
      `Leaks detected in ${checksWithLeaks} heating check${checksWithLeaks !== 1 ? "s" : ""} — water leaks can cause structural damage, create slip hazards, and indicate system integrity issues.`,
    );
  }

  if (childSafetyCoverRate < 80 && radiatorsInChildAreas > 0) {
    concerns.push(
      `Only ${childSafetyCoverRate}% of radiators in children's areas have safety covers — exposed hot radiators pose a burn risk to children.`,
    );
  }

  if (deadBatteryThermostats > 0) {
    concerns.push(
      `${deadBatteryThermostats} thermostat${deadBatteryThermostats !== 1 ? "s have" : " has"} dead batteries — non-functioning thermostats cannot regulate temperature, potentially leaving areas overheated or cold.`,
    );
  }

  if (faultResolutionRate < 50 && totalFaultsFound > 0) {
    concerns.push(
      `Only ${faultResolutionRate}% of identified boiler faults resolved — unresolved faults may escalate into safety hazards or equipment failures.`,
    );
  }

  if (overdueRadiatorBleeds > 0 && totalRadiators > 0) {
    concerns.push(
      `${overdueRadiatorBleeds} radiator${overdueRadiatorBleeds !== 1 ? "s are" : " is"} overdue for bleeding — trapped air reduces heating efficiency and creates cold spots.`,
    );
  }

  if (poorConditionRadiators > 0 && totalRadiators > 0) {
    concerns.push(
      `${poorConditionRadiators} radiator${poorConditionRadiators !== 1 ? "s are" : " is"} in poor condition — deteriorated radiators may leak, corrode, or fail to heat adequately.`,
    );
  }

  if (tamperProofRate < 80 && childAccessibleThermostats > 0) {
    concerns.push(
      `Only ${tamperProofRate}% of child-accessible thermostats are tamper-proof — children may change temperature settings, creating unsafe heating conditions.`,
    );
  }

  if (evenHeatingRate < 70 && totalRadiators > 0) {
    concerns.push(
      `Only ${evenHeatingRate}% of radiators heating evenly — uneven heating indicates air locks, sludge build-up, or system balancing issues that need professional attention.`,
    );
  }

  if (energyEfficiencyRate < 40 && energyComponentScores.length > 0) {
    concerns.push(
      `Energy efficiency at only ${energyEfficiencyRate}% — poor energy efficiency means higher costs and a less comfortable living environment for children.`,
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: BoilerHeatingRecommendation[] = [];
  let rank = 0;

  if (coTestsFailed > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Take immediate action on failed carbon monoxide tests — isolate affected appliances until a Gas Safe engineer confirms they are safe. Install or verify carbon monoxide detectors in all relevant areas. Carbon monoxide is an immediate threat to life.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  if (gasSafetyComplianceRate < 50 && totalBoilerServices > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently obtain valid CP12 gas safety certificates for all gas appliances — operating without current certification is a legal offence and represents a critical safety risk to children. Schedule emergency gas safety inspections immediately.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  if (boilerServicingRate < 50 && totalBoilerServices > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Schedule overdue boiler services immediately with Gas Safe registered engineers — annual servicing is essential for safety, legal compliance, and reliability. Establish a servicing calendar to prevent future lapses.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  if (poorConditionBoilers > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Arrange professional assessment of boilers in poor or condemned condition — plan for replacement or major repair to ensure children have reliable, safe heating. Budget for capital expenditure if replacement is needed.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  if (childSafetyCoverRate < 80 && radiatorsInChildAreas > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Fit safety covers to all radiators in children's areas — uncovered radiators pose a burn risk, particularly for younger children. Use covers that allow heat circulation while preventing direct contact.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  if (deadBatteryThermostats > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Replace dead thermostat batteries immediately — non-functioning thermostats leave areas without temperature control, which may result in unsafe temperatures for children.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Premises safe, well maintained, suitable",
    });
  }

  if (radiatorMaintenanceRate < 50 && totalRadiators > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a radiator bleeding and inspection programme across the home — address overdue maintenance to restore efficient heating in all areas and eliminate cold spots in children's living spaces.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  if (thermostatCalibrationRate < 50 && totalThermostats > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently calibrate all overdue thermostats — inaccurate temperature controls mean children's spaces may not be maintained at appropriate temperatures, affecting comfort and potentially safety.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Premises safe, well maintained, suitable",
    });
  }

  if (checksWithLeaks > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Investigate and repair all detected heating system leaks — leaks indicate system integrity issues, can cause structural damage, and may lead to heating failures during cold weather.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  if (
    gasSafetyComplianceRate >= 50 &&
    gasSafetyComplianceRate < 80 &&
    totalBoilerServices > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Renew lapsed CP12 gas safety certificates as a priority — aim for 100% compliance. All gas appliances must have current certification to operate legally and safely.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  if (
    boilerServicingRate >= 50 &&
    boilerServicingRate < 80 &&
    totalBoilerServices > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Bring all boiler servicing up to date — establish a proactive servicing schedule with automated reminders to prevent future lapses in annual servicing requirements.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  if (
    heatingCheckRate < 80 &&
    totalHeatingChecks > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Complete all overdue heating system checks — regular system checks identify emerging issues before they cause breakdowns. Schedule seasonal checks before winter as a minimum.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  if (
    radiatorMaintenanceRate >= 50 &&
    radiatorMaintenanceRate < 80 &&
    totalRadiators > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve radiator maintenance compliance — schedule regular bleeding rounds and inspections to ensure all radiators operate efficiently and provide consistent warmth.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Premises safe, well maintained, suitable",
    });
  }

  if (
    thermostatCalibrationRate >= 50 &&
    thermostatCalibrationRate < 80 &&
    totalThermostats > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Schedule thermostat calibration for overdue units — accurate temperature control is essential for maintaining appropriate living conditions for children.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Premises safe, well maintained, suitable",
    });
  }

  if (faultResolutionRate < 80 && totalFaultsFound > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Resolve all outstanding boiler faults — tracked faults left unresolved may worsen and lead to safety incidents or equipment failure. Establish a fault tracking and closure process.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  if (agingBoilers > 0 && totalBoilerServices > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop a replacement plan for aging boilers over 15 years old — older boilers are less efficient and more prone to failure. Plan capital investment for modern, energy-efficient replacements.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  if (lowBatteryThermostats > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Replace low batteries in thermostats before they fail — proactive battery replacement prevents loss of temperature control and ensures continuous monitoring.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Premises safe, well maintained, suitable",
    });
  }

  if (energyEfficiencyRate < 60 && energyComponentScores.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Commission an energy efficiency review and implement recommendations — improving insulation, draught-proofing, and heating controls will reduce costs and improve children's comfort.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  if (pipeInsulationRate < 80 && totalHeatingChecks > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve pipe insulation throughout the heating system — adequate insulation reduces heat loss, improves efficiency, and helps maintain consistent temperatures in all areas of the home.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Premises safe, well maintained, suitable",
    });
  }

  if (tamperProofRate < 100 && childAccessibleThermostats > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Fit tamper-proof covers to all child-accessible thermostats — prevent children from inadvertently changing temperature settings, which could create unsafe heating conditions.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  if (evenHeatingRate < 80 && evenHeatingRate >= 70 && totalRadiators > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Arrange professional system balancing and power-flush to improve radiator performance — uneven heating often indicates sludge build-up or air locks that can be resolved with maintenance.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Premises safe, well maintained, suitable",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: BoilerHeatingInsight[] = [];

  // -- Critical insights --

  if (coTestsFailed > 0) {
    insights.push({
      text: `${coTestsFailed} carbon monoxide test${coTestsFailed !== 1 ? "s" : ""} failed during boiler servicing. Carbon monoxide is an odourless, colourless gas that can be fatal. Any failed CO test is an immediate life-safety issue requiring urgent action under Reg 25. Affected appliances must be isolated and not used until confirmed safe by a Gas Safe engineer.`,
      severity: "critical",
    });
  }

  if (gasSafetyComplianceRate < 50 && totalBoilerServices > 0) {
    insights.push({
      text: `Only ${gasSafetyComplianceRate}% of CP12 gas safety certificates are valid. Operating gas appliances without a current CP12 certificate is a criminal offence under the Gas Safety (Installation and Use) Regulations 1998. This represents a fundamental compliance failure that Ofsted will treat as a serious safeguarding concern under Reg 25.`,
      severity: "critical",
    });
  }

  if (boilerServicingRate < 50 && totalBoilerServices > 0) {
    insights.push({
      text: `Only ${boilerServicingRate}% of boiler services are current. Unserviced boilers pose risks including carbon monoxide leaks, gas leaks, and sudden failure. Annual boiler servicing is a core premises safety requirement and Ofsted expects evidence of current servicing at every inspection.`,
      severity: "critical",
    });
  }

  if (poorConditionBoilers > 0) {
    insights.push({
      text: `${poorConditionBoilers} boiler${poorConditionBoilers !== 1 ? "s" : ""} in poor or condemned condition. Boilers in deteriorated condition are unreliable and may pose gas safety risks. A condemned boiler must not be operated. The home should plan for replacement and ensure alternative heating arrangements are in place.`,
      severity: "critical",
    });
  }

  if (radiatorMaintenanceRate < 50 && totalRadiators > 0) {
    insights.push({
      text: `Only ${radiatorMaintenanceRate}% radiator maintenance compliance. Poorly maintained radiators lead to cold spots, inefficient heating, and increased energy costs. Children may be living in inadequately heated areas, which affects their comfort, health, and wellbeing.`,
      severity: "critical",
    });
  }

  if (thermostatCalibrationRate < 50 && totalThermostats > 0) {
    insights.push({
      text: `Only ${thermostatCalibrationRate}% of thermostats have current calibration. Without accurate temperature controls, the home cannot ensure children's spaces are maintained at appropriate temperatures. Overheating and underheating both pose welfare risks to children.`,
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (
    boilerServicingRate >= 50 &&
    boilerServicingRate < 80 &&
    totalBoilerServices > 0
  ) {
    insights.push({
      text: `Boiler servicing compliance at ${boilerServicingRate}% — improving but some services remain overdue. Each overdue service represents a period without professional verification that the boiler is operating safely. Aim for 100% compliance.`,
      severity: "warning",
    });
  }

  if (
    gasSafetyComplianceRate >= 50 &&
    gasSafetyComplianceRate < 80 &&
    totalBoilerServices > 0
  ) {
    insights.push({
      text: `CP12 gas safety compliance at ${gasSafetyComplianceRate}% — some certificates have lapsed. Even partial non-compliance with gas safety certification is a legal and safety concern that Ofsted will flag.`,
      severity: "warning",
    });
  }

  if (
    heatingCheckRate >= 50 &&
    heatingCheckRate < 80 &&
    totalHeatingChecks > 0
  ) {
    insights.push({
      text: `Heating check compliance at ${heatingCheckRate}% — some system checks are overdue. Regular heating checks catch developing issues before they cause breakdowns, particularly important ahead of winter months.`,
      severity: "warning",
    });
  }

  if (
    radiatorMaintenanceRate >= 50 &&
    radiatorMaintenanceRate < 80 &&
    totalRadiators > 0
  ) {
    insights.push({
      text: `Radiator maintenance at ${radiatorMaintenanceRate}% — some radiators need attention. Unmaintained radiators accumulate air and sludge, reducing heating efficiency and creating uneven temperatures across the home.`,
      severity: "warning",
    });
  }

  if (
    thermostatCalibrationRate >= 50 &&
    thermostatCalibrationRate < 80 &&
    totalThermostats > 0
  ) {
    insights.push({
      text: `Thermostat calibration at ${thermostatCalibrationRate}% — some units are overdue. Inaccurate thermostats may display incorrect temperatures, meaning staff cannot reliably verify that children's areas are at appropriate temperatures.`,
      severity: "warning",
    });
  }

  if (overdueBoilerServices > 0 && overdueBoilerServices < totalBoilerServices) {
    insights.push({
      text: `${overdueBoilerServices} boiler service${overdueBoilerServices !== 1 ? "s" : ""} overdue. Each overdue service extends the period without professional verification that gas appliances are safe. Address these promptly to maintain compliance.`,
      severity: "warning",
    });
  }

  if (overdueHeatingChecks > 0 && overdueHeatingChecks < totalHeatingChecks) {
    insights.push({
      text: `${overdueHeatingChecks} heating check${overdueHeatingChecks !== 1 ? "s" : ""} overdue. Overdue checks mean emerging issues like leaks, pump failures, or pressure problems may go undetected.`,
      severity: "warning",
    });
  }

  if (agingBoilers > 0 && poorConditionBoilers === 0) {
    insights.push({
      text: `${agingBoilers} boiler${agingBoilers !== 1 ? "s" : ""} over 15 years old. While currently operational, aging boilers have reduced efficiency and higher failure risk. Plan proactively for replacement to avoid emergency situations during cold weather.`,
      severity: "warning",
    });
  }

  if (lowBatteryThermostats > 0 && deadBatteryThermostats === 0) {
    insights.push({
      text: `${lowBatteryThermostats} thermostat${lowBatteryThermostats !== 1 ? "s have" : " has"} low battery. Replace proactively to prevent loss of temperature control, which could leave areas unregulated.`,
      severity: "warning",
    });
  }

  if (avgVariance > 2.0 && totalThermostats > 0) {
    insights.push({
      text: `Average thermostat variance is ${avgVariance}°C — temperature readings are deviating significantly from actual room temperatures. This level of inaccuracy means temperature settings cannot be relied upon for maintaining children's comfort.`,
      severity: "warning",
    });
  }

  if (
    energyEfficiencyRate >= 40 &&
    energyEfficiencyRate < 60 &&
    energyComponentScores.length > 0
  ) {
    insights.push({
      text: `Energy efficiency at ${energyEfficiencyRate}% — moderate efficiency with scope for improvement. Better insulation, draught-proofing, and heating controls would reduce running costs and improve comfort for children.`,
      severity: "warning",
    });
  }

  if (overdueCalibrations > 0 && totalThermostats > 0) {
    insights.push({
      text: `${overdueCalibrations} thermostat calibration${overdueCalibrations !== 1 ? "s" : ""} overdue. Without regular calibration, thermostats drift from accuracy, making temperature regulation unreliable across the home.`,
      severity: "warning",
    });
  }

  if (
    childComfortRate >= 50 &&
    childComfortRate < 70 &&
    comfortComponents.length > 0
  ) {
    insights.push({
      text: `Child comfort score at ${childComfortRate}% — some aspects of the heating system are not delivering optimal comfort. Review temperature settings, zone coverage, and hot water availability to ensure children's daily comfort.`,
      severity: "warning",
    });
  }

  // Analysis of heating system types
  const systemTypeCounts: Record<string, number> = {};
  for (const hc of heating_check_records) {
    systemTypeCounts[hc.system_type] = (systemTypeCounts[hc.system_type] ?? 0) + 1;
  }
  const topSystemTypes = Object.entries(systemTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topSystemTypes.length > 0 && totalHeatingChecks >= 3) {
    const sysStr = topSystemTypes
      .map(([t, c]) => `${t.replace(/_/g, " ")} (${c})`)
      .join(", ");
    insights.push({
      text: `Heating system profile: ${sysStr}. Consider whether the system mix provides adequate coverage and resilience for the home's needs, particularly during peak winter demand.`,
      severity: "warning",
    });
  }

  // Analysis of thermostat types
  const thermostatTypeCounts: Record<string, number> = {};
  for (const th of thermostat_records) {
    thermostatTypeCounts[th.thermostat_type] = (thermostatTypeCounts[th.thermostat_type] ?? 0) + 1;
  }
  const topThermostatTypes = Object.entries(thermostatTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topThermostatTypes.length > 0 && totalThermostats >= 3) {
    const thStr = topThermostatTypes
      .map(([t, c]) => `${t.replace(/_/g, " ")} (${c})`)
      .join(", ");
    insights.push({
      text: `Thermostat profile: ${thStr}. Smart and programmable thermostats offer better efficiency and scheduling capabilities — consider upgrading older units for improved control and energy savings.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (boiler_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding boiler and heating system management — all servicing is current, gas safety is fully compliant, radiators and thermostats are well-maintained, and children live in warm, safe, and efficiently heated living spaces. This is strong evidence of exemplary premises management under Reg 25.",
      severity: "positive",
    });
  }

  if (
    gasSafetyComplianceRate >= 100 &&
    carbonMonoxideSafetyRate >= 100 &&
    totalBoilerServices > 0
  ) {
    insights.push({
      text: "Full CP12 gas safety certification and 100% carbon monoxide test pass rate — the home meets the highest standard of gas safety compliance, ensuring children are protected from gas-related hazards.",
      severity: "positive",
    });
  }

  if (
    boilerServicingRate >= 100 &&
    gasSafeEngineerRate >= 100 &&
    totalBoilerServices > 0
  ) {
    insights.push({
      text: "All boiler services current and conducted by Gas Safe registered engineers — the home demonstrates exemplary compliance with both the scheduling and quality of gas appliance maintenance.",
      severity: "positive",
    });
  }

  if (
    radiatorMaintenanceRate >= 90 &&
    evenHeatingRate >= 90 &&
    totalRadiators > 0
  ) {
    insights.push({
      text: `${radiatorMaintenanceRate}% radiator maintenance with ${evenHeatingRate}% even heating — the home's radiator management ensures efficient, consistent warmth in all areas, directly benefiting children's daily comfort.`,
      severity: "positive",
    });
  }

  if (
    thermostatCalibrationRate >= 100 &&
    thermostatAccuracyRate >= 90 &&
    totalThermostats > 0
  ) {
    insights.push({
      text: `All thermostats calibrated with ${thermostatAccuracyRate}% reading accurately — precise temperature control gives the home confidence that children's spaces are maintained at exactly the intended temperatures.`,
      severity: "positive",
    });
  }

  if (
    childComfortRate >= 90 &&
    comfortComponents.length > 0
  ) {
    insights.push({
      text: `${childComfortRate}% child comfort score — children benefit from consistently warm living spaces, reliable hot water, accurate temperature control, and even heat distribution throughout the home.`,
      severity: "positive",
    });
  }

  if (
    energyEfficiencyRate >= 80 &&
    energyComponentScores.length > 0
  ) {
    insights.push({
      text: `Energy efficiency at ${energyEfficiencyRate}% — the home operates its heating system efficiently, combining good insulation, draught-proofing, and optimised controls. This reduces environmental impact and operational costs while maintaining comfort.`,
      severity: "positive",
    });
  }

  if (
    faultResolutionRate >= 100 &&
    totalFaultsFound > 0
  ) {
    insights.push({
      text: "Every boiler fault identified has been resolved — the home demonstrates responsive maintenance that ensures no defect persists long enough to become a safety risk.",
      severity: "positive",
    });
  }

  if (
    childSafetyCoverRate >= 100 &&
    radiatorsInChildAreas > 0 &&
    tamperProofRate >= 100 &&
    childAccessibleThermostats > 0
  ) {
    insights.push({
      text: "All radiators in children's areas have safety covers and all accessible thermostats are tamper-proof — the home proactively manages child-specific heating safety risks.",
      severity: "positive",
    });
  }

  if (
    leakFreeRate >= 100 &&
    waterPressureRate >= 100 &&
    pumpFunctionalRate >= 100 &&
    totalHeatingChecks > 0
  ) {
    insights.push({
      text: "No leaks, normal water pressure, and fully functional pumps across all heating checks — the heating system operates with full integrity and reliability.",
      severity: "positive",
    });
  }

  if (
    heatingCheckRate >= 100 &&
    boilerServicingRate >= 100 &&
    totalHeatingChecks > 0 &&
    totalBoilerServices > 0
  ) {
    insights.push({
      text: "Both heating system checks and boiler servicing are fully current — the home maintains a comprehensive, proactive approach to heating infrastructure management that supports children's safety and comfort year-round.",
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (boiler_rating === "outstanding") {
    headline =
      "Outstanding boiler and heating system management — all servicing current, gas safety compliant, and children benefit from warm, safe, efficiently heated living spaces.";
  } else if (boiler_rating === "good") {
    headline = `Good boiler and heating system management — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (boiler_rating === "adequate") {
    headline = `Adequate boiler and heating system management — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure safe, reliable heating for children.`;
  } else {
    headline = `Boiler and heating system management is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure children live in a safely heated environment.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    boiler_rating,
    boiler_score: score,
    headline,
    total_boiler_services: totalBoilerServices,
    total_heating_checks: totalHeatingChecks,
    total_radiators: totalRadiators,
    total_thermostats: totalThermostats,
    total_energy_records: totalEnergyRecords,
    boiler_servicing_rate: boilerServicingRate,
    heating_check_rate: heatingCheckRate,
    radiator_maintenance_rate: radiatorMaintenanceRate,
    thermostat_calibration_rate: thermostatCalibrationRate,
    energy_efficiency_rate: energyEfficiencyRate,
    child_comfort_rate: childComfortRate,
    gas_safety_compliance_rate: gasSafetyComplianceRate,
    carbon_monoxide_safety_rate: carbonMonoxideSafetyRate,
    fault_resolution_rate: faultResolutionRate,
    boiler_condition_score: boilerConditionScore,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
