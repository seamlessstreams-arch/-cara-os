// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME BEDROOM TEMPERATURE & VENTILATION INTELLIGENCE ENGINE
// Monitors bedroom environment quality including temperature monitoring,
// ventilation adequacy, heating system checks, window opening compliance,
// and child comfort with bedroom temperature.
// Measures temperature monitoring rates, ventilation adequacy, heating check
// completion, window compliance, child comfort satisfaction, and action
// response times to temperature/ventilation concerns.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 25 (Premises), Reg 5 (Accommodation).
// SCCIF: "Safety and well-being", "Living in the home".
// Store keys: temperatureMonitoringRecords, ventilationRecords,
//             heatingCheckRecords, windowComplianceRecords,
//             childComfortRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface TemperatureMonitoringRecordInput {
  id: string;
  bedroom_id: string;
  child_id: string | null;
  date: string;
  time_of_day: "morning" | "afternoon" | "evening" | "night" | "other";
  temperature_celsius: number;
  target_min_celsius: number;
  target_max_celsius: number;
  within_range: boolean;
  thermometer_calibrated: boolean;
  recorded_by: string;
  location: "bedroom" | "corridor" | "communal" | "bathroom" | "other";
  season: "spring" | "summer" | "autumn" | "winter";
  action_required: boolean;
  action_taken: boolean;
  action_details: string;
  notes: string;
  created_at: string;
}

export interface VentilationRecordInput {
  id: string;
  bedroom_id: string;
  child_id: string | null;
  date: string;
  ventilation_type: "natural" | "mechanical" | "trickle_vent" | "extractor" | "air_purifier" | "other";
  adequate: boolean;
  air_quality_checked: boolean;
  air_quality_acceptable: boolean;
  condensation_present: boolean;
  mould_present: boolean;
  ventilation_system_working: boolean;
  maintenance_required: boolean;
  maintenance_completed: boolean;
  inspected_by: string;
  notes: string;
  created_at: string;
}

export interface HeatingCheckRecordInput {
  id: string;
  bedroom_id: string;
  date: string;
  heating_type: "central_heating" | "radiator" | "underfloor" | "electric" | "storage_heater" | "other";
  system_operational: boolean;
  thermostat_working: boolean;
  thermostat_accessible_to_child: boolean;
  radiator_guards_fitted: boolean;
  temperature_controllable: boolean;
  safety_check_passed: boolean;
  last_service_date: string | null;
  service_overdue: boolean;
  engineer_certified: boolean;
  issues_found: boolean;
  issues_resolved: boolean;
  resolution_date: string | null;
  checked_by: string;
  notes: string;
  created_at: string;
}

export interface WindowComplianceRecordInput {
  id: string;
  bedroom_id: string;
  child_id: string | null;
  date: string;
  window_restrictor_fitted: boolean;
  restrictor_functional: boolean;
  window_lockable: boolean;
  lock_functional: boolean;
  window_opens_adequately: boolean;
  safety_glass_fitted: boolean;
  trickle_vent_present: boolean;
  trickle_vent_open: boolean;
  window_condition: "good" | "fair" | "poor" | "damaged";
  draught_proofing_adequate: boolean;
  child_can_open_for_ventilation: boolean;
  fall_risk_assessed: boolean;
  fall_risk_mitigated: boolean;
  compliance_met: boolean;
  inspected_by: string;
  notes: string;
  created_at: string;
}

export interface ChildComfortRecordInput {
  id: string;
  child_id: string;
  bedroom_id: string;
  date: string;
  comfort_rating: number; // 1-5
  temperature_preference: "too_cold" | "comfortable" | "too_warm";
  ventilation_preference: "stuffy" | "comfortable" | "draughty";
  sleeps_well_temperature: boolean;
  bedding_adequate: boolean;
  bedding_seasonal: boolean;
  heating_control_understood: boolean;
  can_adjust_temperature: boolean;
  window_usage_confident: boolean;
  requested_changes: boolean;
  changes_actioned: boolean;
  changes_details: string;
  child_voice_captured: boolean;
  feedback_method: "verbal" | "written" | "keyworker_session" | "house_meeting" | "other";
  notes: string;
  created_at: string;
}

export interface BedroomTempInput {
  today: string;
  total_children: number;
  temperature_monitoring_records: TemperatureMonitoringRecordInput[];
  ventilation_records: VentilationRecordInput[];
  heating_check_records: HeatingCheckRecordInput[];
  window_compliance_records: WindowComplianceRecordInput[];
  child_comfort_records: ChildComfortRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type BedroomTempRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface BedroomTempInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface BedroomTempRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface BedroomTempResult {
  temperature_rating: BedroomTempRating;
  temperature_score: number | null;
  headline: string;
  total_temperature_records: number;
  total_ventilation_records: number;
  total_heating_check_records: number;
  total_window_compliance_records: number;
  total_child_comfort_records: number;
  temperature_monitoring_rate: number | null;
  ventilation_rate: number | null;
  heating_check_rate: number | null;
  window_compliance_rate: number | null;
  child_comfort_rate: number | null;
  action_response_rate: number | null;
  strengths: string[];
  concerns: string[];
  recommendations: BedroomTempRecommendation[];
  insights: BedroomTempInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): BedroomTempRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: BedroomTempRating,
  score: number,
  headline: string,
): BedroomTempResult {
  return {
    temperature_rating: rating,
    temperature_score: score,
    headline,
    total_temperature_records: 0,
    total_ventilation_records: 0,
    total_heating_check_records: 0,
    total_window_compliance_records: 0,
    total_child_comfort_records: 0,
    temperature_monitoring_rate: 0,
    ventilation_rate: 0,
    heating_check_rate: 0,
    window_compliance_rate: 0,
    child_comfort_rate: 0,
    action_response_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeBedroomTemperatureVentilation(
  input: BedroomTempInput,
): BedroomTempResult {
  const {
    total_children,
    temperature_monitoring_records,
    ventilation_records,
    heating_check_records,
    window_compliance_records,
    child_comfort_records,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    temperature_monitoring_records.length === 0 &&
    ventilation_records.length === 0 &&
    heating_check_records.length === 0 &&
    window_compliance_records.length === 0 &&
    child_comfort_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess bedroom temperature and ventilation.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No bedroom temperature or ventilation data recorded despite children on placement — temperature monitoring, ventilation checks, and child comfort assessments require urgent attention.",
      ),
      concerns: [
        "No temperature monitoring, ventilation, heating check, window compliance, or child comfort records exist despite children being on placement — the home cannot evidence safe and comfortable bedroom environments.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured recording of bedroom temperature monitoring, ventilation checks, heating system inspections, window compliance assessments, and child comfort surveys to evidence safe, comfortable bedroom environments for all children.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 25 — Premises",
        },
        {
          rank: 2,
          recommendation:
            "Establish a regular schedule for checking bedroom temperatures at different times of day, ensuring ventilation is adequate, and capturing children's views on their bedroom comfort as part of ongoing care planning.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 5 — Accommodation",
        },
      ],
      insights: [
        {
          text: "The complete absence of bedroom temperature and ventilation records means the home cannot demonstrate that children's bedrooms are maintained at safe, comfortable temperatures with adequate ventilation. This represents a significant gap in premises safety and child welfare evidence.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- Temperature monitoring metrics ---
  const totalTempRecords = temperature_monitoring_records.length;
  const withinRangeTemp = temperature_monitoring_records.filter((t) => t.within_range).length;
  const temperatureMonitoringRate = pct(withinRangeTemp, totalTempRecords);

  const calibratedThermometers = temperature_monitoring_records.filter(
    (t) => t.thermometer_calibrated,
  ).length;
  const calibrationRate = pct(calibratedThermometers, totalTempRecords);

  const tempActionRequired = temperature_monitoring_records.filter(
    (t) => t.action_required,
  ).length;
  const tempActionTaken = temperature_monitoring_records.filter(
    (t) => t.action_required && t.action_taken,
  ).length;

  const nightTimeRecords = temperature_monitoring_records.filter(
    (t) => t.time_of_day === "night",
  ).length;
  const nightTimeWithinRange = temperature_monitoring_records.filter(
    (t) => t.time_of_day === "night" && t.within_range,
  ).length;
  const nightTimeComplianceRate = pct(nightTimeWithinRange, nightTimeRecords);

  // Seasonal coverage analysis
  const seasonCounts: Record<string, number> = {};
  for (const t of temperature_monitoring_records) {
    seasonCounts[t.season] = (seasonCounts[t.season] ?? 0) + 1;
  }
  const seasonsWithData = Object.keys(seasonCounts).length;

  // --- Ventilation metrics ---
  const totalVentRecords = ventilation_records.length;
  const adequateVentilation = ventilation_records.filter((v) => v.adequate).length;
  const ventilationRate = pct(adequateVentilation, totalVentRecords);

  const condensationPresent = ventilation_records.filter(
    (v) => v.condensation_present,
  ).length;
  const condensationRate = pct(condensationPresent, totalVentRecords);

  const mouldPresent = ventilation_records.filter((v) => v.mould_present).length;
  const mouldRate = pct(mouldPresent, totalVentRecords);

  const ventMaintenanceRequired = ventilation_records.filter(
    (v) => v.maintenance_required,
  ).length;
  const ventMaintenanceCompleted = ventilation_records.filter(
    (v) => v.maintenance_required && v.maintenance_completed,
  ).length;

  // --- Heating check metrics ---
  const totalHeatingChecks = heating_check_records.length;
  const systemOperational = heating_check_records.filter(
    (h) => h.system_operational,
  ).length;
  const heatingOperationalRate = pct(systemOperational, totalHeatingChecks);

  const thermostatWorking = heating_check_records.filter(
    (h) => h.thermostat_working,
  ).length;
  const thermostatWorkingRate = pct(thermostatWorking, totalHeatingChecks);

  const safetyCheckPassed = heating_check_records.filter(
    (h) => h.safety_check_passed,
  ).length;
  const safetyCheckRate = pct(safetyCheckPassed, totalHeatingChecks);

  const serviceOverdue = heating_check_records.filter(
    (h) => h.service_overdue,
  ).length;
  const serviceOverdueRate = pct(serviceOverdue, totalHeatingChecks);

  const heatingIssuesFound = heating_check_records.filter(
    (h) => h.issues_found,
  ).length;
  const heatingIssuesResolved = heating_check_records.filter(
    (h) => h.issues_found && h.issues_resolved,
  ).length;

  const engineerCertified = heating_check_records.filter(
    (h) => h.engineer_certified,
  ).length;
  const engineerCertifiedRate = pct(engineerCertified, totalHeatingChecks);

  // Composite heating check rate: operational + safety passed + thermostat working
  const heatingCheckRate =
    totalHeatingChecks > 0
      ? Math.round(
          (heatingOperationalRate + safetyCheckRate + thermostatWorkingRate) / 3,
        )
      : null;

  // --- Window compliance metrics ---
  const totalWindowRecords = window_compliance_records.length;
  const windowCompliant = window_compliance_records.filter(
    (w) => w.compliance_met,
  ).length;
  const windowComplianceRate = pct(windowCompliant, totalWindowRecords);

  const restrictorFitted = window_compliance_records.filter(
    (w) => w.window_restrictor_fitted,
  ).length;
  const restrictorRate = pct(restrictorFitted, totalWindowRecords);

  const fallRiskAssessed = window_compliance_records.filter(
    (w) => w.fall_risk_assessed,
  ).length;
  const fallRiskAssessedRate = pct(fallRiskAssessed, totalWindowRecords);

  const poorConditionWindows = window_compliance_records.filter(
    (w) => w.window_condition === "poor" || w.window_condition === "damaged",
  ).length;
  const poorConditionRate = pct(poorConditionWindows, totalWindowRecords);

  // --- Child comfort metrics ---
  const totalComfortRecords = child_comfort_records.length;
  const comfortableTemp = child_comfort_records.filter(
    (c) => c.temperature_preference === "comfortable",
  ).length;
  const comfortableTempRate = pct(comfortableTemp, totalComfortRecords);

  const sleepsWellTemp = child_comfort_records.filter(
    (c) => c.sleeps_well_temperature,
  ).length;
  const sleepsWellRate = pct(sleepsWellTemp, totalComfortRecords);

  const beddingAdequate = child_comfort_records.filter(
    (c) => c.bedding_adequate,
  ).length;
  const beddingAdequateRate = pct(beddingAdequate, totalComfortRecords);

  const beddingSeasonal = child_comfort_records.filter(
    (c) => c.bedding_seasonal,
  ).length;
  const beddingSeasonalRate = pct(beddingSeasonal, totalComfortRecords);

  const canAdjustTemp = child_comfort_records.filter(
    (c) => c.can_adjust_temperature,
  ).length;
  const canAdjustTempRate = pct(canAdjustTemp, totalComfortRecords);

  const changesRequested = child_comfort_records.filter(
    (c) => c.requested_changes,
  ).length;
  const changesActioned = child_comfort_records.filter(
    (c) => c.requested_changes && c.changes_actioned,
  ).length;
  const changesActionedRate = pct(changesActioned, changesRequested);

  const childVoiceCaptured = child_comfort_records.filter(
    (c) => c.child_voice_captured,
  ).length;
  const childVoiceCapturedRate = pct(childVoiceCaptured, totalComfortRecords);

  const avgComfortRating =
    totalComfortRecords > 0
      ? Math.round(
          (child_comfort_records.reduce((sum, c) => sum + c.comfort_rating, 0) /
            totalComfortRecords) *
            100,
        ) / 100
      : null;

  // Composite child comfort rate: comfortable temp + sleeps well + bedding adequate
  const childComfortRate =
    totalComfortRecords > 0
      ? Math.round(
          (comfortableTempRate + sleepsWellRate + beddingAdequateRate) / 3,
        )
      : null;

  // Unique children surveyed
  const uniqueChildrenSurveyed = new Set(
    child_comfort_records.map((c) => c.child_id),
  ).size;
  const childCoverage =
    total_children > 0 ? pct(uniqueChildrenSurveyed, total_children) : 0;

  // --- Action response rate composite ---
  const actionNumerators: number[] = [];
  const actionDenominators: number[] = [];

  if (tempActionRequired > 0) {
    actionNumerators.push(tempActionTaken);
    actionDenominators.push(tempActionRequired);
  }
  if (ventMaintenanceRequired > 0) {
    actionNumerators.push(ventMaintenanceCompleted);
    actionDenominators.push(ventMaintenanceRequired);
  }
  if (heatingIssuesFound > 0) {
    actionNumerators.push(heatingIssuesResolved);
    actionDenominators.push(heatingIssuesFound);
  }
  if (changesRequested > 0) {
    actionNumerators.push(changesActioned);
    actionDenominators.push(changesRequested);
  }

  const totalActionNum = actionNumerators.reduce((a, b) => a + b, 0);
  const totalActionDenom = actionDenominators.reduce((a, b) => a + b, 0);
  const actionResponseRate = pct(totalActionNum, totalActionDenom);

  // ── Scoring: base 52 ─────────────────────────────────────────────────

  let score = 52;

  // --- Bonus 1: temperatureMonitoringRate (>=90: +4, >=70: +2) ---
  if (temperatureMonitoringRate >= 90) score += 4;
  else if (temperatureMonitoringRate >= 70) score += 2;

  // --- Bonus 2: ventilationRate (>=95: +4, >=80: +2) ---
  if (ventilationRate >= 95) score += 4;
  else if (ventilationRate >= 80) score += 2;

  // --- Bonus 3: heatingCheckRate (>=90: +3, >=70: +1) ---
  if ((heatingCheckRate ?? 0) >= 90) score += 3;
  else if ((heatingCheckRate ?? 0) >= 70) score += 1;

  // --- Bonus 4: windowComplianceRate (>=90: +3, >=70: +1) ---
  if (windowComplianceRate >= 90) score += 3;
  else if (windowComplianceRate >= 70) score += 1;

  // --- Bonus 5: childComfortRate (>=90: +3, >=70: +1) ---
  if ((childComfortRate ?? 0) >= 90) score += 3;
  else if ((childComfortRate ?? 0) >= 70) score += 1;

  // --- Bonus 6: actionResponseRate (>=90: +3, >=70: +1) ---
  if (actionResponseRate >= 90) score += 3;
  else if (actionResponseRate >= 70) score += 1;

  // --- Bonus 7: safetyCheckRate (>=90: +3, >=70: +1) ---
  if (safetyCheckRate >= 90) score += 3;
  else if (safetyCheckRate >= 70) score += 1;

  // --- Bonus 8: avgComfortRating (>=4.0: +3, >=3.0: +1) ---
  if ((avgComfortRating ?? 0) >= 4.0) score += 3;
  else if ((avgComfortRating ?? 0) >= 3.0) score += 1;

  // --- Bonus 9: childVoiceCapturedRate (>=90: +2, >=70: +1) ---
  if (childVoiceCapturedRate >= 90) score += 2;
  else if (childVoiceCapturedRate >= 70) score += 1;

  // ── Penalties ─────────────────────────────────────────────────────────

  // temperatureMonitoringRate < 40 → -5 (guarded)
  if (temperatureMonitoringRate < 40 && temperature_monitoring_records.length > 0) score -= 5;

  // ventilationRate < 50 → -5 (guarded)
  if (ventilationRate < 50 && ventilation_records.length > 0) score -= 5;

  // heatingCheckRate < 40 → -5 (guarded)
  if ((heatingCheckRate ?? 0) < 40 && heating_check_records.length > 0) score -= 5;

  // childComfortRate < 30 → -3 (guarded)
  if ((childComfortRate ?? 0) < 30 && child_comfort_records.length > 0) score -= 3;

  score = clamp(score, 0, 100);

  const temperature_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (temperatureMonitoringRate >= 90 && totalTempRecords > 0) {
    strengths.push(
      `${temperatureMonitoringRate}% of temperature readings within target range — the home demonstrates excellent bedroom temperature management ensuring children sleep and live in comfortable conditions.`,
    );
  } else if (temperatureMonitoringRate >= 70 && totalTempRecords > 0) {
    strengths.push(
      `${temperatureMonitoringRate}% temperature monitoring compliance — bedroom temperatures are generally well-managed and within acceptable ranges.`,
    );
  }

  if (ventilationRate >= 95 && totalVentRecords > 0) {
    strengths.push(
      `${ventilationRate}% ventilation adequacy — bedrooms are consistently well-ventilated, supporting healthy indoor air quality for children.`,
    );
  } else if (ventilationRate >= 80 && totalVentRecords > 0) {
    strengths.push(
      `${ventilationRate}% adequate ventilation across bedroom checks — good air quality management contributing to children's health and comfort.`,
    );
  }

  if ((heatingCheckRate ?? 0) >= 90 && totalHeatingChecks > 0) {
    strengths.push(
      `Heating system check rate at ${heatingCheckRate}% — heating systems are well-maintained, operational, and safely managed across all bedrooms.`,
    );
  } else if ((heatingCheckRate ?? 0) >= 70 && totalHeatingChecks > 0) {
    strengths.push(
      `Heating system check rate at ${heatingCheckRate}% — heating systems are generally operational and safely maintained.`,
    );
  }

  if (windowComplianceRate >= 90 && totalWindowRecords > 0) {
    strengths.push(
      `${windowComplianceRate}% window compliance — windows across bedrooms meet safety and ventilation requirements, with appropriate restrictors and safety measures in place.`,
    );
  } else if (windowComplianceRate >= 70 && totalWindowRecords > 0) {
    strengths.push(
      `${windowComplianceRate}% window compliance rate — most bedroom windows meet safety and ventilation standards.`,
    );
  }

  if ((childComfortRate ?? 0) >= 90 && totalComfortRecords > 0) {
    strengths.push(
      `Child comfort rate at ${childComfortRate}% — children report high levels of satisfaction with bedroom temperature, sleep quality, and bedding provision.`,
    );
  } else if ((childComfortRate ?? 0) >= 70 && totalComfortRecords > 0) {
    strengths.push(
      `Child comfort rate at ${childComfortRate}% — most children report comfortable bedroom temperatures and adequate sleeping conditions.`,
    );
  }

  if (actionResponseRate >= 90 && totalActionDenom > 0) {
    strengths.push(
      `${actionResponseRate}% action response rate — temperature, ventilation, and heating concerns are consistently addressed, demonstrating responsive premises management.`,
    );
  } else if (actionResponseRate >= 70 && totalActionDenom > 0) {
    strengths.push(
      `${actionResponseRate}% action response rate — the home generally responds to temperature and ventilation concerns promptly.`,
    );
  }

  if (safetyCheckRate >= 90 && totalHeatingChecks > 0) {
    strengths.push(
      `${safetyCheckRate}% of heating safety checks passed — the home maintains high standards of heating safety across all bedrooms.`,
    );
  } else if (safetyCheckRate >= 70 && totalHeatingChecks > 0) {
    strengths.push(
      `${safetyCheckRate}% of heating safety checks passed — good compliance with heating safety requirements.`,
    );
  }

  if ((avgComfortRating ?? 0) >= 4.0 && totalComfortRecords > 0) {
    strengths.push(
      `Average child comfort rating of ${avgComfortRating}/5 — children are genuinely satisfied with their bedroom environment and temperature conditions.`,
    );
  } else if ((avgComfortRating ?? 0) >= 3.0 && totalComfortRecords > 0) {
    strengths.push(
      `Average child comfort rating of ${avgComfortRating}/5 — children are generally satisfied with their bedroom temperature conditions.`,
    );
  }

  if (childVoiceCapturedRate >= 90 && totalComfortRecords > 0) {
    strengths.push(
      `${childVoiceCapturedRate}% of comfort assessments capture the child's voice — demonstrating genuine engagement with children's views on their bedroom environment.`,
    );
  } else if (childVoiceCapturedRate >= 70 && totalComfortRecords > 0) {
    strengths.push(
      `${childVoiceCapturedRate}% of comfort assessments include child voice — good practice in seeking children's views on bedroom comfort.`,
    );
  }

  if (nightTimeComplianceRate >= 90 && nightTimeRecords > 0) {
    strengths.push(
      `${nightTimeComplianceRate}% of night-time temperature readings within range — bedroom temperatures are well-managed during sleeping hours, supporting children's rest and wellbeing.`,
    );
  }

  if (calibrationRate >= 90 && totalTempRecords > 0) {
    strengths.push(
      "Temperature monitoring equipment is regularly calibrated — readings are reliable and accurate, supporting evidence-based premises management.",
    );
  }

  if (mouldRate === 0 && totalVentRecords > 0) {
    strengths.push(
      "No mould detected in any bedroom ventilation checks — the home maintains healthy indoor environments free from damp-related hazards.",
    );
  }

  if (childCoverage >= 100 && total_children > 0) {
    strengths.push(
      "Every child has had their bedroom comfort assessed — the home ensures all children's views on their sleeping environment are captured and considered.",
    );
  } else if (childCoverage >= 80 && total_children > 0) {
    strengths.push(
      `${childCoverage}% of children have had bedroom comfort assessed — strong coverage ensuring most children's environmental preferences are known.`,
    );
  }

  if (changesActionedRate >= 90 && changesRequested > 0) {
    strengths.push(
      `${changesActionedRate}% of child-requested bedroom changes actioned — the home demonstrates excellent responsiveness to children's preferences and needs.`,
    );
  }

  if (seasonsWithData >= 4 && totalTempRecords > 0) {
    strengths.push(
      "Temperature monitoring covers all four seasons — the home demonstrates year-round vigilance in maintaining comfortable bedroom temperatures regardless of weather conditions.",
    );
  }

  if (restrictorRate >= 95 && totalWindowRecords > 0) {
    strengths.push(
      `${restrictorRate}% of windows fitted with restrictors — comprehensive window safety measures are in place across all bedrooms.`,
    );
  }

  if (fallRiskAssessedRate >= 95 && totalWindowRecords > 0) {
    strengths.push(
      `${fallRiskAssessedRate}% of windows have fall risk assessments — the home takes a thorough approach to window safety.`,
    );
  }

  if (canAdjustTempRate >= 80 && totalComfortRecords > 0) {
    strengths.push(
      `${canAdjustTempRate}% of children can adjust their bedroom temperature — promoting independence and personal comfort.`,
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (temperatureMonitoringRate < 40 && totalTempRecords > 0) {
    concerns.push(
      `Only ${temperatureMonitoringRate}% of bedroom temperature readings within target range — the majority of bedrooms are not maintained at safe, comfortable temperatures, posing a risk to children's health and wellbeing.`,
    );
  } else if (temperatureMonitoringRate < 70 && temperatureMonitoringRate >= 40 && totalTempRecords > 0) {
    concerns.push(
      `Temperature monitoring compliance at ${temperatureMonitoringRate}% — bedroom temperatures are not consistently within acceptable ranges, indicating scope for improved temperature management.`,
    );
  }

  if (ventilationRate < 50 && totalVentRecords > 0) {
    concerns.push(
      `Only ${ventilationRate}% adequate ventilation — the majority of bedroom ventilation checks reveal inadequate air quality, risking children's respiratory health and comfort.`,
    );
  } else if (ventilationRate < 80 && ventilationRate >= 50 && totalVentRecords > 0) {
    concerns.push(
      `Ventilation adequacy at ${ventilationRate}% — inconsistent bedroom ventilation requires attention to ensure healthy indoor air quality across all bedrooms.`,
    );
  }

  if ((heatingCheckRate ?? 0) < 40 && totalHeatingChecks > 0) {
    concerns.push(
      `Heating system check rate at only ${heatingCheckRate}% — significant failures in heating system operation, safety checks, or thermostat function pose a risk to children's comfort and safety.`,
    );
  } else if ((heatingCheckRate ?? 0) < 70 && (heatingCheckRate ?? 0) >= 40 && totalHeatingChecks > 0) {
    concerns.push(
      `Heating system check rate at ${heatingCheckRate}% — heating systems are not consistently passing operational and safety requirements.`,
    );
  }

  if (windowComplianceRate < 50 && totalWindowRecords > 0) {
    concerns.push(
      `Only ${windowComplianceRate}% window compliance — significant non-compliance with window safety and ventilation standards creates potential safety risks in children's bedrooms.`,
    );
  } else if (windowComplianceRate < 70 && windowComplianceRate >= 50 && totalWindowRecords > 0) {
    concerns.push(
      `Window compliance at ${windowComplianceRate}% — not all bedroom windows meet safety and ventilation requirements, requiring attention.`,
    );
  }

  if ((childComfortRate ?? 0) < 30 && totalComfortRecords > 0) {
    concerns.push(
      `Child comfort rate at only ${childComfortRate}% — children are reporting significant dissatisfaction with bedroom temperatures, sleep quality, or bedding, indicating fundamental failures in bedroom environment management.`,
    );
  } else if ((childComfortRate ?? 0) < 70 && (childComfortRate ?? 0) >= 30 && totalComfortRecords > 0) {
    concerns.push(
      `Child comfort rate at ${childComfortRate}% — not all children are comfortable with their bedroom temperature conditions and sleeping arrangements.`,
    );
  }

  if (mouldRate >= 20 && totalVentRecords > 0) {
    concerns.push(
      `Mould detected in ${mouldRate}% of ventilation checks — mould presence in children's bedrooms is a serious health hazard requiring urgent remediation and improved ventilation.`,
    );
  } else if (mouldRate > 0 && mouldRate < 20 && totalVentRecords > 0) {
    concerns.push(
      `Mould detected in ${mouldRate}% of ventilation checks — any mould in children's bedrooms requires attention to protect respiratory health.`,
    );
  }

  if (condensationRate >= 30 && totalVentRecords > 0) {
    concerns.push(
      `Condensation present in ${condensationRate}% of ventilation checks — persistent condensation indicates inadequate ventilation and risks mould development in children's bedrooms.`,
    );
  } else if (condensationRate >= 15 && condensationRate < 30 && totalVentRecords > 0) {
    concerns.push(
      `Condensation present in ${condensationRate}% of bedroom ventilation checks — this may indicate ventilation issues that could lead to mould if unaddressed.`,
    );
  }

  if (serviceOverdueRate >= 20 && totalHeatingChecks > 0) {
    concerns.push(
      `${serviceOverdueRate}% of heating systems have overdue servicing — failure to maintain heating equipment compromises both safety and reliability of bedroom heating.`,
    );
  }

  if (actionResponseRate < 50 && totalActionDenom > 0) {
    concerns.push(
      `Only ${actionResponseRate}% action response rate — temperature, ventilation, and heating concerns are not being adequately addressed, leaving children in uncomfortable or unsafe conditions.`,
    );
  } else if (actionResponseRate < 70 && actionResponseRate >= 50 && totalActionDenom > 0) {
    concerns.push(
      `Action response rate at ${actionResponseRate}% — some identified temperature and ventilation issues are not being resolved in a timely manner.`,
    );
  }

  if (childCoverage < 50 && total_children > 0 && totalComfortRecords > 0) {
    concerns.push(
      `Only ${childCoverage}% of children have had bedroom comfort assessed — many children's views on their sleeping environment are not being captured.`,
    );
  }

  if (poorConditionRate >= 20 && totalWindowRecords > 0) {
    concerns.push(
      `${poorConditionRate}% of windows in poor or damaged condition — deteriorating windows compromise both thermal efficiency and safety in children's bedrooms.`,
    );
  }

  if (nightTimeComplianceRate < 50 && nightTimeRecords > 0) {
    concerns.push(
      `Only ${nightTimeComplianceRate}% of night-time temperature readings within range — children may be sleeping in bedrooms that are too cold or too warm, affecting rest quality and health.`,
    );
  }

  if (fallRiskAssessedRate < 50 && totalWindowRecords > 0) {
    concerns.push(
      `Only ${fallRiskAssessedRate}% of windows have fall risk assessments — inadequate assessment of fall risks from windows in children's bedrooms is a safety concern.`,
    );
  }

  if (childVoiceCapturedRate < 50 && totalComfortRecords > 0) {
    concerns.push(
      `Only ${childVoiceCapturedRate}% of comfort assessments capture the child's voice — children's views on their bedroom environment are not being adequately sought or recorded.`,
    );
  }

  if (beddingAdequateRate < 70 && totalComfortRecords > 0) {
    concerns.push(
      `Only ${beddingAdequateRate}% of children report adequate bedding — insufficient bedding provision affects children's comfort and ability to sleep well.`,
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: BedroomTempRecommendation[] = [];
  let rank = 0;

  if (temperatureMonitoringRate < 40 && totalTempRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review bedroom temperature management — identify bedrooms consistently outside target range and implement immediate corrective actions including thermostat adjustment, heating system repair, and insulation improvements.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (ventilationRate < 50 && totalVentRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Address inadequate bedroom ventilation as a priority — ensure all bedrooms have functioning ventilation systems, trickle vents are open, windows can be opened for fresh air, and any condensation or mould issues are remediated immediately.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if ((heatingCheckRate ?? 0) < 40 && totalHeatingChecks > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently service and repair all heating systems — ensure every bedroom has a functioning, safe heating system with working thermostats. Commission a qualified engineer to inspect and certify all heating equipment.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (mouldRate >= 20 && totalVentRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Commission professional mould remediation for all affected bedrooms — mould in children's sleeping environments poses serious health risks. Identify and address root causes including ventilation, heating, and insulation deficiencies.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if ((childComfortRate ?? 0) < 30 && totalComfortRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Take urgent action to improve children's bedroom comfort — review each child's temperature preferences, bedding provision, and ability to control their environment. Address all identified discomfort issues immediately.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (windowComplianceRate < 50 && totalWindowRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Conduct an immediate review of all bedroom windows for safety compliance — ensure restrictors are fitted and functional, safety glass is installed where required, and fall risk assessments are completed for all windows.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (actionResponseRate < 50 && totalActionDenom > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a temperature and ventilation action tracker — ensure all identified concerns have assigned owners, deadlines, and follow-up. Children should not remain in uncomfortable or unsafe bedroom conditions while issues await resolution.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (serviceOverdueRate >= 20 && totalHeatingChecks > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Schedule overdue heating system servicing immediately — regular maintenance is essential for both safety and reliability. Establish a preventive maintenance calendar to prevent future service lapses.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (condensationRate >= 30 && totalVentRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Investigate the root causes of persistent condensation in bedrooms — consider improved ventilation systems, dehumidifiers, draught proofing, and heating schedules. Condensation left unaddressed leads to mould growth and health risks.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (
    temperatureMonitoringRate >= 40 &&
    temperatureMonitoringRate < 70 &&
    totalTempRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop a temperature improvement plan targeting bedrooms consistently outside range — install smart thermostats where possible, adjust heating schedules, and monitor trends to identify systemic issues.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (
    ventilationRate >= 50 &&
    ventilationRate < 80 &&
    totalVentRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve ventilation across bedrooms not meeting adequacy standards — review trickle vent usage, window opening guidance for children, and consider mechanical ventilation for bedrooms with persistent air quality issues.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (
    (childComfortRate ?? 0) >= 30 &&
    (childComfortRate ?? 0) < 70 &&
    totalComfortRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Work with individual children to improve their bedroom comfort — review bedding provision, temperature preferences, and ability to adjust heating. Ensure children understand how to use thermostats and windows safely.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Accommodation",
    });
  }

  if (
    windowComplianceRate >= 50 &&
    windowComplianceRate < 70 &&
    totalWindowRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Address remaining window compliance gaps — prioritise safety glass installation, restrictor repairs, and fall risk mitigations. Develop a planned maintenance schedule for window safety checks.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (
    childCoverage < 80 &&
    childCoverage >= 50 &&
    total_children > 0 &&
    totalComfortRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Extend bedroom comfort assessments to cover all children — ensure every child has their temperature preferences, bedding needs, and environmental comfort captured and reviewed regularly.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (
    childVoiceCapturedRate < 70 &&
    totalComfortRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen the capture of children's voices in comfort assessments — use keyworker sessions, house meetings, and age-appropriate methods to ensure every child can express their views on bedroom temperature and ventilation.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (
    (heatingCheckRate ?? 0) >= 40 &&
    (heatingCheckRate ?? 0) < 70 &&
    totalHeatingChecks > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve heating system maintenance and safety checks — ensure all systems are regularly serviced, thermostats are functional, and safety inspections are completed by qualified engineers.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (
    calibrationRate < 70 &&
    totalTempRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement regular calibration of temperature monitoring equipment — accurate readings are essential for evidencing safe bedroom environments. Maintain a calibration log for all thermometers and sensors.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (
    beddingSeasonalRate < 70 &&
    totalComfortRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review bedding provision to ensure seasonal appropriateness — children should have access to lighter bedding in summer and warmer options in winter, with changes managed proactively rather than reactively.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Accommodation",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: BedroomTempInsight[] = [];

  // -- Critical insights --

  if (temperatureMonitoringRate < 40 && totalTempRecords > 0) {
    insights.push({
      text: `Only ${temperatureMonitoringRate}% of bedroom temperature readings within target range. Children are living and sleeping in bedrooms that are consistently too hot or too cold. Ofsted expects the home to maintain comfortable, safe living conditions under Reg 25 — this level of non-compliance suggests systemic failure in premises management.`,
      severity: "critical",
    });
  }

  if (ventilationRate < 50 && totalVentRecords > 0) {
    insights.push({
      text: `Only ${ventilationRate}% adequate ventilation across bedroom checks. Poor ventilation leads to stale air, condensation, and mould — all of which directly affect children's respiratory health and quality of sleep. Inadequate ventilation in sleeping environments is a serious premises safety concern.`,
      severity: "critical",
    });
  }

  if ((heatingCheckRate ?? 0) < 40 && totalHeatingChecks > 0) {
    insights.push({
      text: `Heating system check rate at only ${heatingCheckRate}%. Significant failures in heating operation, safety checks, or thermostat function mean children's bedrooms may not be safely or adequately heated. This represents a direct risk under CHR 2015 Reg 25 and requires immediate remediation.`,
      severity: "critical",
    });
  }

  if (mouldRate >= 20 && totalVentRecords > 0) {
    insights.push({
      text: `Mould detected in ${mouldRate}% of bedroom ventilation checks. Mould in children's sleeping environments is a significant health hazard associated with respiratory conditions, allergies, and weakened immune systems. This requires immediate professional remediation and root-cause analysis.`,
      severity: "critical",
    });
  }

  if ((childComfortRate ?? 0) < 30 && totalComfortRecords > 0) {
    insights.push({
      text: `Child comfort rate at only ${childComfortRate}%. Children are telling the home that they are not comfortable in their bedrooms — temperatures are wrong, bedding is inadequate, or sleep quality is poor. Failing to act on children's expressed discomfort undermines the home's duty of care and children's trust.`,
      severity: "critical",
    });
  }

  if (totalComfortRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No child comfort records despite children being on placement. Without capturing children's views on their bedroom environment, the home cannot evidence that it understands or responds to children's comfort needs. Children's voice on their living conditions is a fundamental aspect of quality care.",
      severity: "critical",
    });
  }

  if (windowComplianceRate < 50 && totalWindowRecords > 0) {
    insights.push({
      text: `Only ${windowComplianceRate}% window compliance. Significant non-compliance with window safety standards — including missing restrictors, lack of safety glass, or unassessed fall risks — creates potential for serious injury. Window safety in children's bedrooms is a core premises safety requirement.`,
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (
    temperatureMonitoringRate >= 40 &&
    temperatureMonitoringRate < 70 &&
    totalTempRecords > 0
  ) {
    insights.push({
      text: `Temperature monitoring compliance at ${temperatureMonitoringRate}% — while improving, too many bedrooms are still outside target ranges. Reviewing heating schedules, thermostat settings, and insulation would help bring consistency.`,
      severity: "warning",
    });
  }

  if (
    ventilationRate >= 50 &&
    ventilationRate < 80 &&
    totalVentRecords > 0
  ) {
    insights.push({
      text: `Ventilation adequacy at ${ventilationRate}% — some bedrooms are not receiving sufficient fresh air. Ensuring trickle vents are open, windows can be used safely, and mechanical systems are maintained would improve air quality.`,
      severity: "warning",
    });
  }

  if (
    (heatingCheckRate ?? 0) >= 40 &&
    (heatingCheckRate ?? 0) < 70 &&
    totalHeatingChecks > 0
  ) {
    insights.push({
      text: `Heating system check rate at ${heatingCheckRate}% — some heating systems are not meeting operational or safety standards. Regular servicing and prompt repair of faults would improve this.`,
      severity: "warning",
    });
  }

  if (
    windowComplianceRate >= 50 &&
    windowComplianceRate < 70 &&
    totalWindowRecords > 0
  ) {
    insights.push({
      text: `Window compliance at ${windowComplianceRate}% — while many windows meet standards, gaps in safety compliance remain. A systematic approach to window safety across all bedrooms would strengthen the home's premises safety evidence.`,
      severity: "warning",
    });
  }

  if (
    (childComfortRate ?? 0) >= 30 &&
    (childComfortRate ?? 0) < 70 &&
    totalComfortRecords > 0
  ) {
    insights.push({
      text: `Child comfort rate at ${childComfortRate}% — some children are not comfortable with their bedroom temperatures or sleeping conditions. Individual conversations with children about their preferences and needs would help identify and address specific issues.`,
      severity: "warning",
    });
  }

  if (
    actionResponseRate >= 50 &&
    actionResponseRate < 70 &&
    totalActionDenom > 0
  ) {
    insights.push({
      text: `Action response rate at ${actionResponseRate}% — some identified temperature and ventilation concerns are going unaddressed. Implementing a formal action tracker with accountability would ensure issues are resolved promptly.`,
      severity: "warning",
    });
  }

  if (
    condensationRate >= 15 &&
    condensationRate < 30 &&
    totalVentRecords > 0
  ) {
    insights.push({
      text: `Condensation present in ${condensationRate}% of ventilation checks — moderate condensation levels suggest ventilation improvements may be needed before damp issues develop further.`,
      severity: "warning",
    });
  }

  if (
    (avgComfortRating ?? 0) >= 2.0 &&
    (avgComfortRating ?? 0) < 3.0 &&
    totalComfortRecords > 0
  ) {
    insights.push({
      text: `Average child comfort rating at ${avgComfortRating}/5 — children are expressing below-average satisfaction with their bedroom environments. Targeted improvements to individual bedrooms based on children's feedback would help.`,
      severity: "warning",
    });
  }

  if (
    serviceOverdueRate >= 10 &&
    serviceOverdueRate < 20 &&
    totalHeatingChecks > 0
  ) {
    insights.push({
      text: `${serviceOverdueRate}% of heating systems have overdue servicing — while not yet critical, delayed maintenance increases the risk of breakdowns during cold weather and may compromise safety certifications.`,
      severity: "warning",
    });
  }

  if (
    calibrationRate >= 50 &&
    calibrationRate < 70 &&
    totalTempRecords > 0
  ) {
    insights.push({
      text: `Only ${calibrationRate}% of thermometers calibrated — without regular calibration, temperature readings may be inaccurate, undermining the home's ability to evidence safe bedroom environments.`,
      severity: "warning",
    });
  }

  // Seasonal gap analysis
  if (seasonsWithData > 0 && seasonsWithData < 4 && totalTempRecords > 3) {
    const allSeasons = ["spring", "summer", "autumn", "winter"];
    const missingSeasons = allSeasons.filter(
      (s) => !seasonCounts[s] || seasonCounts[s] === 0,
    );
    if (missingSeasons.length > 0) {
      insights.push({
        text: `Temperature monitoring has no data for ${missingSeasons.join(", ")} — bedroom temperatures vary significantly across seasons. Monitoring should cover the full year to evidence consistent comfort regardless of weather conditions.`,
        severity: "warning",
      });
    }
  }

  // -- Positive insights --

  if (temperature_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding bedroom temperature and ventilation management — temperatures are consistently within range, ventilation is adequate, heating systems are safe and operational, windows comply with safety standards, and children report high levels of comfort. This contributes positively to children's health, wellbeing, and quality of sleep.",
      severity: "positive",
    });
  }

  if (
    temperatureMonitoringRate >= 90 &&
    nightTimeComplianceRate >= 90 &&
    totalTempRecords > 0 &&
    nightTimeRecords > 0
  ) {
    insights.push({
      text: `Excellent temperature management with ${temperatureMonitoringRate}% overall compliance and ${nightTimeComplianceRate}% night-time compliance — the home ensures children's bedrooms are at comfortable temperatures throughout the day and night, supporting quality rest and wellbeing.`,
      severity: "positive",
    });
  }

  if (
    ventilationRate >= 95 &&
    mouldRate === 0 &&
    condensationRate < 5 &&
    totalVentRecords > 0
  ) {
    insights.push({
      text: `${ventilationRate}% adequate ventilation with no mould and minimal condensation — exemplary air quality management demonstrating genuine commitment to children's respiratory health and comfortable sleeping environments.`,
      severity: "positive",
    });
  }

  if (
    (childComfortRate ?? 0) >= 90 &&
    (avgComfortRating ?? 0) >= 4.0 &&
    totalComfortRecords > 0
  ) {
    insights.push({
      text: `${childComfortRate}% child comfort with an average rating of ${avgComfortRating}/5 — children genuinely feel comfortable in their bedrooms. This reflects the home's attentiveness to individual preferences and its commitment to creating homely, personalised sleeping environments.`,
      severity: "positive",
    });
  }

  if (
    actionResponseRate >= 90 &&
    totalActionDenom > 0
  ) {
    insights.push({
      text: `${actionResponseRate}% action response rate across all temperature, ventilation, and heating concerns — the home demonstrates a responsive, proactive approach to premises management. Issues are identified and resolved promptly, minimising children's exposure to discomfort or unsafe conditions.`,
      severity: "positive",
    });
  }

  if (
    windowComplianceRate >= 90 &&
    fallRiskAssessedRate >= 90 &&
    totalWindowRecords > 0
  ) {
    insights.push({
      text: `${windowComplianceRate}% window compliance with ${fallRiskAssessedRate}% fall risk assessment coverage — the home maintains comprehensive window safety standards across all bedrooms, balancing ventilation access with children's safety.`,
      severity: "positive",
    });
  }

  if (
    childCoverage >= 100 &&
    childVoiceCapturedRate >= 90 &&
    total_children > 0 &&
    totalComfortRecords > 0
  ) {
    insights.push({
      text: "Every child has had their bedroom comfort assessed with their voice genuinely captured — the home demonstrates an inclusive, child-centred approach to bedroom environment management where every child's comfort matters.",
      severity: "positive",
    });
  }

  if (
    (heatingCheckRate ?? 0) >= 90 &&
    safetyCheckRate >= 90 &&
    engineerCertifiedRate >= 90 &&
    totalHeatingChecks > 0
  ) {
    insights.push({
      text: `Heating systems at ${heatingCheckRate}% operational with ${safetyCheckRate}% safety compliance and ${engineerCertifiedRate}% engineer certification — the home maintains exemplary heating safety standards protecting children from heating-related risks.`,
      severity: "positive",
    });
  }

  if (
    changesActionedRate >= 90 &&
    changesRequested > 0 &&
    childVoiceCapturedRate >= 80 &&
    totalComfortRecords > 0
  ) {
    insights.push({
      text: `${changesActionedRate}% of child-requested bedroom changes actioned — when children speak up about their comfort, the home listens and acts. This builds trust and demonstrates genuine respect for children's preferences and autonomy.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (temperature_rating === "outstanding") {
    headline =
      "Outstanding bedroom temperature and ventilation management — temperatures are consistently within range, ventilation is adequate, heating systems are safe, and children report high levels of comfort.";
  } else if (temperature_rating === "good") {
    headline = `Good bedroom temperature and ventilation management — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (temperature_rating === "adequate") {
    headline = `Adequate bedroom temperature and ventilation management — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure safe, comfortable bedroom environments for all children.`;
  } else {
    headline = `Bedroom temperature and ventilation management is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure children's bedrooms are safe, comfortable, and well-ventilated.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    temperature_rating,
    temperature_score: score,
    headline,
    total_temperature_records: totalTempRecords,
    total_ventilation_records: totalVentRecords,
    total_heating_check_records: totalHeatingChecks,
    total_window_compliance_records: totalWindowRecords,
    total_child_comfort_records: totalComfortRecords,
    temperature_monitoring_rate: temperatureMonitoringRate,
    ventilation_rate: ventilationRate,
    heating_check_rate: heatingCheckRate,
    window_compliance_rate: windowComplianceRate,
    child_comfort_rate: childComfortRate,
    action_response_rate: actionResponseRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
