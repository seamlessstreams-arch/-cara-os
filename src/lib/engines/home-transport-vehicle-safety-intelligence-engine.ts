// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME TRANSPORT & VEHICLE SAFETY INTELLIGENCE ENGINE
// Monitors transport safety for children across the home — vehicle maintenance
// compliance, pre-use checks, driver qualification tracking, journey risk
// assessments, and transport log quality.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 25 (Premises), Health & Safety at Work Act 1974.
// SCCIF: "Experiences and progress of children — safety".
// Store keys: transportLogRecords, vehicleChecks, vehiclePreUseChecks,
//             drivingRecords, transportRAs
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface TransportLogInput {
  id: string;
  date: string;
  driver_id: string;
  vehicle_id: string;
  child_ids: string[];
  journey_purpose: string;
  start_mileage: number;
  end_mileage: number;
  seatbelts_checked: boolean;
  incidents_recorded: boolean;
  created_at: string;
}

export interface VehicleCheckInput {
  id: string;
  vehicle_id: string;
  check_date: string;
  check_type: "weekly" | "monthly" | "annual";
  passed: boolean;
  defects_found: number;
  defects_resolved: number;
  mot_current: boolean;
  insurance_current: boolean;
  service_due_date: string;
  created_at: string;
}

export interface VehiclePreUseCheckInput {
  id: string;
  vehicle_id: string;
  check_date: string;
  staff_id: string;
  lights_ok: boolean;
  tyres_ok: boolean;
  brakes_ok: boolean;
  fluids_ok: boolean;
  overall_pass: boolean;
  created_at: string;
}

export interface DrivingRecordInput {
  id: string;
  staff_id: string;
  licence_verified: boolean;
  licence_expiry: string;
  business_insurance: boolean;
  advanced_training: boolean;
  created_at: string;
}

export interface TransportRAInput {
  id: string;
  journey_type: string;
  date: string;
  risk_level: "low" | "medium" | "high";
  controls_identified: boolean;
  approved_by: string;
  review_date: string;
  created_at: string;
}

export interface TransportVehicleSafetyInput {
  today: string;
  total_children: number;
  transport_logs: TransportLogInput[];
  vehicle_checks: VehicleCheckInput[];
  vehicle_pre_use_checks: VehiclePreUseCheckInput[];
  driving_records: DrivingRecordInput[];
  transport_ras: TransportRAInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type TransportSafetyRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface TransportSafetyInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface TransportSafetyRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface TransportVehicleSafetyResult {
  transport_rating: TransportSafetyRating;
  transport_score: number;
  headline: string;
  total_transport_logs: number;
  vehicle_check_compliance_rate: number;
  pre_use_check_completion_rate: number;
  driver_qualification_currency_rate: number;
  risk_assessment_completion_rate: number;
  journey_log_completion_rate: number;
  seatbelt_compliance_rate: number;
  insurance_currency_rate: number;
  mot_service_currency_rate: number;
  defect_resolution_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: TransportSafetyRecommendation[];
  insights: TransportSafetyInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): TransportSafetyRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: TransportSafetyRating,
  score: number,
  headline: string,
): TransportVehicleSafetyResult {
  return {
    transport_rating: rating,
    transport_score: score,
    headline,
    total_transport_logs: 0,
    vehicle_check_compliance_rate: 0,
    pre_use_check_completion_rate: 0,
    driver_qualification_currency_rate: 0,
    risk_assessment_completion_rate: 0,
    journey_log_completion_rate: 0,
    seatbelt_compliance_rate: 0,
    insurance_currency_rate: 0,
    mot_service_currency_rate: 0,
    defect_resolution_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeTransportVehicleSafety(
  input: TransportVehicleSafetyInput,
): TransportVehicleSafetyResult {
  const {
    today,
    total_children,
    transport_logs,
    vehicle_checks,
    vehicle_pre_use_checks,
    driving_records,
    transport_ras,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    transport_logs.length === 0 &&
    vehicle_checks.length === 0 &&
    vehicle_pre_use_checks.length === 0 &&
    driving_records.length === 0 &&
    transport_ras.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess transport and vehicle safety.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No transport or vehicle safety data recorded despite children on placement — transport safety requires urgent attention.",
      ),
      concerns: [
        "No transport logs, vehicle checks, pre-use checks, driving records, or transport risk assessments exist despite children being on placement — the home cannot evidence that children are transported safely.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Immediately establish transport safety recording practices including vehicle checks, pre-use inspections, driver qualification verification, journey logging, and transport risk assessments.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 25 — Premises",
        },
        {
          rank: 2,
          recommendation:
            "Ensure all vehicles used to transport children have current MOT, insurance, and documented maintenance schedules, and that all drivers have verified licences and appropriate business insurance.",
          urgency: "immediate",
          regulatory_ref: "Health & Safety at Work Act 1974",
        },
      ],
      insights: [
        {
          text: "The complete absence of transport safety records means Ofsted cannot verify that children are transported safely. This is a fundamental failure in transport oversight under Reg 25 and health and safety legislation.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  const totalTransportLogs = transport_logs.length;
  const totalVehicleChecks = vehicle_checks.length;
  const totalPreUseChecks = vehicle_pre_use_checks.length;
  const totalDrivingRecords = driving_records.length;
  const totalTransportRAs = transport_ras.length;

  // --- Vehicle check compliance: checks that passed ---
  const vehicleChecksPassed = vehicle_checks.filter((c) => c.passed).length;
  const vehicleCheckComplianceRate = pct(vehicleChecksPassed, totalVehicleChecks);

  // --- Pre-use check completion: checks with overall_pass ---
  const preUseChecksPassed = vehicle_pre_use_checks.filter((c) => c.overall_pass).length;
  const preUseCheckCompletionRate = pct(preUseChecksPassed, totalPreUseChecks);

  // --- Driver qualification currency: licence verified + not expired ---
  const driversQualified = driving_records.filter(
    (d) => d.licence_verified && d.licence_expiry >= today,
  ).length;
  const driverQualificationCurrencyRate = pct(driversQualified, totalDrivingRecords);

  // --- Risk assessment completion: RAs with controls identified ---
  const rasWithControls = transport_ras.filter((r) => r.controls_identified).length;
  const riskAssessmentCompletionRate = pct(rasWithControls, totalTransportRAs);

  // --- Journey log completion: logs with valid mileage + purpose ---
  const completeLogs = transport_logs.filter(
    (l) =>
      l.journey_purpose &&
      l.journey_purpose.trim() !== "" &&
      l.end_mileage > l.start_mileage,
  ).length;
  const journeyLogCompletionRate = pct(completeLogs, totalTransportLogs);

  // --- Seatbelt compliance: logs where seatbelts were checked ---
  const seatbeltsChecked = transport_logs.filter((l) => l.seatbelts_checked).length;
  const seatbeltComplianceRate = pct(seatbeltsChecked, totalTransportLogs);

  // --- Insurance currency: checks with current insurance ---
  const insuranceCurrent = vehicle_checks.filter((c) => c.insurance_current).length;
  const insuranceCurrencyRate = pct(insuranceCurrent, totalVehicleChecks);

  // --- MOT/Service currency: checks with current MOT + service not overdue ---
  const motServiceCurrent = vehicle_checks.filter(
    (c) => c.mot_current && c.service_due_date >= today,
  ).length;
  const motServiceCurrencyRate = pct(motServiceCurrent, totalVehicleChecks);

  // --- Defect resolution: defects resolved vs defects found ---
  const totalDefectsFound = vehicle_checks.reduce(
    (sum, c) => sum + c.defects_found,
    0,
  );
  const totalDefectsResolved = vehicle_checks.reduce(
    (sum, c) => sum + c.defects_resolved,
    0,
  );
  const defectResolutionRate = pct(totalDefectsResolved, totalDefectsFound);

  // --- Additional metrics for insights ---
  const driversWithBusinessInsurance = driving_records.filter(
    (d) => d.business_insurance,
  ).length;
  const businessInsuranceRate = pct(driversWithBusinessInsurance, totalDrivingRecords);

  const driversWithAdvancedTraining = driving_records.filter(
    (d) => d.advanced_training,
  ).length;
  const advancedTrainingRate = pct(driversWithAdvancedTraining, totalDrivingRecords);

  const highRiskRAs = transport_ras.filter((r) => r.risk_level === "high").length;
  const highRiskWithControls = transport_ras.filter(
    (r) => r.risk_level === "high" && r.controls_identified,
  ).length;

  const overdueRAs = transport_ras.filter(
    (r) => r.review_date && r.review_date < today,
  ).length;

  const incidentLogs = transport_logs.filter((l) => l.incidents_recorded).length;

  const preUseIssues = vehicle_pre_use_checks.filter(
    (c) => !c.lights_ok || !c.tyres_ok || !c.brakes_ok || !c.fluids_ok,
  ).length;

  const expiredLicences = driving_records.filter(
    (d) => d.licence_expiry < today,
  ).length;

  // ── Scoring: base 52 ─────────────────────────────────────────────────
  // Bonuses sum to exactly 28: 4+4+3+3+3+3+3+3+2 = 28

  let score = 52;

  // --- Bonus 1: vehicleCheckComplianceRate (>=95: +4, >=80: +2) ---
  if (vehicleCheckComplianceRate >= 95) score += 4;
  else if (vehicleCheckComplianceRate >= 80) score += 2;

  // --- Bonus 2: preUseCheckCompletionRate (>=95: +4, >=80: +2) ---
  if (preUseCheckCompletionRate >= 95) score += 4;
  else if (preUseCheckCompletionRate >= 80) score += 2;

  // --- Bonus 3: driverQualificationCurrencyRate (>=95: +3, >=80: +1) ---
  if (driverQualificationCurrencyRate >= 95) score += 3;
  else if (driverQualificationCurrencyRate >= 80) score += 1;

  // --- Bonus 4: riskAssessmentCompletionRate (>=90: +3, >=70: +1) ---
  if (riskAssessmentCompletionRate >= 90) score += 3;
  else if (riskAssessmentCompletionRate >= 70) score += 1;

  // --- Bonus 5: journeyLogCompletionRate (>=95: +3, >=80: +1) ---
  if (journeyLogCompletionRate >= 95) score += 3;
  else if (journeyLogCompletionRate >= 80) score += 1;

  // --- Bonus 6: seatbeltComplianceRate (>=100: +3, >=90: +1) ---
  if (seatbeltComplianceRate >= 100) score += 3;
  else if (seatbeltComplianceRate >= 90) score += 1;

  // --- Bonus 7: insuranceCurrencyRate (>=100: +3, >=80: +1) ---
  if (insuranceCurrencyRate >= 100) score += 3;
  else if (insuranceCurrencyRate >= 80) score += 1;

  // --- Bonus 8: motServiceCurrencyRate (>=100: +3, >=80: +1) ---
  if (motServiceCurrencyRate >= 100) score += 3;
  else if (motServiceCurrencyRate >= 80) score += 1;

  // --- Bonus 9: defectResolutionRate (>=90: +2, >=70: +1) ---
  if (defectResolutionRate >= 90) score += 2;
  else if (defectResolutionRate >= 70) score += 1;

  // ── Penalties ─────────────────────────────────────────────────────────

  // vehicleCheckComplianceRate < 50 → -5
  if (vehicleCheckComplianceRate < 50 && totalVehicleChecks > 0) score -= 5;

  // driverQualificationCurrencyRate < 50 → -5
  if (driverQualificationCurrencyRate < 50 && totalDrivingRecords > 0) score -= 5;

  // seatbeltComplianceRate < 50 → -5
  if (seatbeltComplianceRate < 50 && totalTransportLogs > 0) score -= 5;

  // motServiceCurrencyRate < 50 → -3
  if (motServiceCurrencyRate < 50 && totalVehicleChecks > 0) score -= 3;

  score = clamp(score, 0, 100);

  const transport_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (vehicleCheckComplianceRate >= 95 && totalVehicleChecks > 0) {
    strengths.push(
      `${vehicleCheckComplianceRate}% of vehicle checks passed — the home demonstrates excellent vehicle maintenance compliance ensuring children travel in safe, roadworthy vehicles.`,
    );
  } else if (vehicleCheckComplianceRate >= 80 && totalVehicleChecks > 0) {
    strengths.push(
      `${vehicleCheckComplianceRate}% vehicle check compliance — strong commitment to maintaining vehicles to a safe standard.`,
    );
  }

  if (preUseCheckCompletionRate >= 95 && totalPreUseChecks > 0) {
    strengths.push(
      `${preUseCheckCompletionRate}% of pre-use checks passed — staff consistently verify vehicle safety before each journey, demonstrating embedded safe practice.`,
    );
  } else if (preUseCheckCompletionRate >= 80 && totalPreUseChecks > 0) {
    strengths.push(
      `${preUseCheckCompletionRate}% pre-use check completion — good practice in verifying vehicle safety before journeys.`,
    );
  }

  if (driverQualificationCurrencyRate >= 95 && totalDrivingRecords > 0) {
    strengths.push(
      `${driverQualificationCurrencyRate}% of drivers have current, verified qualifications — the home ensures only appropriately qualified staff transport children.`,
    );
  } else if (driverQualificationCurrencyRate >= 80 && totalDrivingRecords > 0) {
    strengths.push(
      `${driverQualificationCurrencyRate}% driver qualification currency — strong compliance with driver verification requirements.`,
    );
  }

  if (riskAssessmentCompletionRate >= 90 && totalTransportRAs > 0) {
    strengths.push(
      `${riskAssessmentCompletionRate}% of transport risk assessments have controls identified — journey risks are systematically assessed and mitigated.`,
    );
  } else if (riskAssessmentCompletionRate >= 70 && totalTransportRAs > 0) {
    strengths.push(
      `${riskAssessmentCompletionRate}% risk assessment completion — good practice in identifying and managing transport risks.`,
    );
  }

  if (journeyLogCompletionRate >= 95 && totalTransportLogs > 0) {
    strengths.push(
      `${journeyLogCompletionRate}% of journey logs are fully completed — comprehensive transport record-keeping supports accountability and safety oversight.`,
    );
  } else if (journeyLogCompletionRate >= 80 && totalTransportLogs > 0) {
    strengths.push(
      `${journeyLogCompletionRate}% journey log completion — transport records are generally well maintained.`,
    );
  }

  if (seatbeltComplianceRate >= 100 && totalTransportLogs > 0) {
    strengths.push(
      "Seatbelt checks recorded on every journey — the home prioritises passenger safety on every trip.",
    );
  } else if (seatbeltComplianceRate >= 90 && totalTransportLogs > 0) {
    strengths.push(
      `${seatbeltComplianceRate}% seatbelt compliance rate — seatbelt checks are consistently completed.`,
    );
  }

  if (insuranceCurrencyRate >= 100 && totalVehicleChecks > 0) {
    strengths.push(
      "All vehicles have current insurance — the home ensures full insurance compliance across its fleet.",
    );
  } else if (insuranceCurrencyRate >= 80 && totalVehicleChecks > 0) {
    strengths.push(
      `${insuranceCurrencyRate}% insurance currency — the majority of vehicles have valid insurance in place.`,
    );
  }

  if (motServiceCurrencyRate >= 100 && totalVehicleChecks > 0) {
    strengths.push(
      "All vehicles have current MOT and are within service schedule — vehicle roadworthiness and maintenance is fully compliant.",
    );
  } else if (motServiceCurrencyRate >= 80 && totalVehicleChecks > 0) {
    strengths.push(
      `${motServiceCurrencyRate}% MOT and service currency — the majority of vehicles are within their MOT and service schedules.`,
    );
  }

  if (defectResolutionRate >= 90 && totalDefectsFound > 0) {
    strengths.push(
      `${defectResolutionRate}% of identified vehicle defects resolved — the home responds effectively to maintenance issues ensuring vehicles remain safe.`,
    );
  } else if (defectResolutionRate >= 70 && totalDefectsFound > 0) {
    strengths.push(
      `${defectResolutionRate}% defect resolution rate — good progress in addressing identified vehicle maintenance issues.`,
    );
  }

  if (businessInsuranceRate >= 95 && totalDrivingRecords > 0) {
    strengths.push(
      `${businessInsuranceRate}% of drivers have business insurance — the home ensures appropriate insurance coverage for staff transporting children.`,
    );
  }

  if (advancedTrainingRate >= 80 && totalDrivingRecords > 0) {
    strengths.push(
      `${advancedTrainingRate}% of drivers have advanced driving training — the home invests in enhanced driver competence beyond minimum requirements.`,
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (vehicleCheckComplianceRate < 50 && totalVehicleChecks > 0) {
    concerns.push(
      `Only ${vehicleCheckComplianceRate}% of vehicle checks passed — the majority of vehicles are failing safety inspections, representing a serious risk to children being transported.`,
    );
  } else if (vehicleCheckComplianceRate < 80 && vehicleCheckComplianceRate >= 50 && totalVehicleChecks > 0) {
    concerns.push(
      `Vehicle check compliance at ${vehicleCheckComplianceRate}% — not all vehicles consistently pass safety inspections, which may indicate maintenance gaps.`,
    );
  }

  if (preUseCheckCompletionRate < 50 && totalPreUseChecks > 0) {
    concerns.push(
      `Only ${preUseCheckCompletionRate}% of pre-use checks passed — the majority of pre-journey safety checks are identifying issues, suggesting vehicles may not be safe for use.`,
    );
  } else if (preUseCheckCompletionRate < 80 && preUseCheckCompletionRate >= 50 && totalPreUseChecks > 0) {
    concerns.push(
      `Pre-use check pass rate at ${preUseCheckCompletionRate}% — some vehicles are not passing pre-journey safety checks.`,
    );
  }

  if (driverQualificationCurrencyRate < 50 && totalDrivingRecords > 0) {
    concerns.push(
      `Only ${driverQualificationCurrencyRate}% of drivers have current, verified qualifications — the majority of staff driving children may not have valid driving credentials.`,
    );
  } else if (driverQualificationCurrencyRate < 80 && driverQualificationCurrencyRate >= 50 && totalDrivingRecords > 0) {
    concerns.push(
      `Driver qualification currency at ${driverQualificationCurrencyRate}% — some staff transporting children do not have verified, current driving qualifications.`,
    );
  }

  if (riskAssessmentCompletionRate < 50 && totalTransportRAs > 0) {
    concerns.push(
      `Only ${riskAssessmentCompletionRate}% of transport risk assessments have controls identified — the majority of journeys lack documented risk controls.`,
    );
  } else if (riskAssessmentCompletionRate < 70 && riskAssessmentCompletionRate >= 50 && totalTransportRAs > 0) {
    concerns.push(
      `Risk assessment completion at ${riskAssessmentCompletionRate}% — not all transport risk assessments identify appropriate control measures.`,
    );
  }

  if (seatbeltComplianceRate < 50 && totalTransportLogs > 0) {
    concerns.push(
      `Only ${seatbeltComplianceRate}% of journeys have documented seatbelt checks — children's basic passenger safety is not being consistently assured.`,
    );
  } else if (seatbeltComplianceRate < 90 && seatbeltComplianceRate >= 50 && totalTransportLogs > 0) {
    concerns.push(
      `Seatbelt compliance at ${seatbeltComplianceRate}% — not all journeys include documented seatbelt checks, which is a fundamental safety measure.`,
    );
  }

  if (insuranceCurrencyRate < 50 && totalVehicleChecks > 0) {
    concerns.push(
      `Only ${insuranceCurrencyRate}% of vehicles have current insurance — the majority of vehicles may be uninsured, which is a legal and safeguarding failure.`,
    );
  } else if (insuranceCurrencyRate < 80 && insuranceCurrencyRate >= 50 && totalVehicleChecks > 0) {
    concerns.push(
      `Insurance currency at ${insuranceCurrencyRate}% — some vehicles lack current insurance documentation.`,
    );
  }

  if (motServiceCurrencyRate < 50 && totalVehicleChecks > 0) {
    concerns.push(
      `Only ${motServiceCurrencyRate}% of vehicles have current MOT and are within service schedule — the majority of vehicles may not be roadworthy.`,
    );
  } else if (motServiceCurrencyRate < 80 && motServiceCurrencyRate >= 50 && totalVehicleChecks > 0) {
    concerns.push(
      `MOT and service currency at ${motServiceCurrencyRate}% — some vehicles are overdue for MOT or servicing.`,
    );
  }

  if (defectResolutionRate < 50 && totalDefectsFound > 0) {
    concerns.push(
      `Only ${defectResolutionRate}% of vehicle defects resolved — the majority of identified maintenance issues remain unaddressed, leaving vehicles in a potentially unsafe condition.`,
    );
  } else if (defectResolutionRate < 70 && defectResolutionRate >= 50 && totalDefectsFound > 0) {
    concerns.push(
      `Defect resolution rate at ${defectResolutionRate}% — a significant proportion of identified vehicle defects remain unresolved.`,
    );
  }

  if (journeyLogCompletionRate < 50 && totalTransportLogs > 0) {
    concerns.push(
      `Only ${journeyLogCompletionRate}% of journey logs are fully completed — the home lacks comprehensive transport records, undermining accountability and safety oversight.`,
    );
  } else if (journeyLogCompletionRate < 80 && journeyLogCompletionRate >= 50 && totalTransportLogs > 0) {
    concerns.push(
      `Journey log completion at ${journeyLogCompletionRate}% — not all transport logs contain complete journey details.`,
    );
  }

  if (expiredLicences > 0) {
    concerns.push(
      `${expiredLicences} staff member${expiredLicences !== 1 ? "s have" : " has"} an expired driving licence — no staff member should transport children without a valid licence.`,
    );
  }

  if (totalVehicleChecks === 0 && total_children > 0 && totalTransportLogs > 0) {
    concerns.push(
      "No vehicle checks recorded despite transport journeys taking place — the home cannot evidence that vehicles used to transport children are safe and roadworthy.",
    );
  }

  if (totalDrivingRecords === 0 && total_children > 0 && totalTransportLogs > 0) {
    concerns.push(
      "No driving records exist despite transport journeys taking place — the home cannot evidence that drivers are qualified and insured to transport children.",
    );
  }

  if (totalTransportRAs === 0 && total_children > 0 && totalTransportLogs > 0) {
    concerns.push(
      "No transport risk assessments recorded despite journeys taking place — journey risks are not being formally assessed and mitigated.",
    );
  }

  if (overdueRAs > 0) {
    concerns.push(
      `${overdueRAs} transport risk assessment${overdueRAs !== 1 ? "s are" : " is"} overdue for review — risk assessments must be kept current to remain effective.`,
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: TransportSafetyRecommendation[] = [];
  let rank = 0;

  if (driverQualificationCurrencyRate < 50 && totalDrivingRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently verify all staff driving qualifications — no staff member should transport children without a valid, verified driving licence and appropriate insurance. Suspend driving duties for unqualified staff immediately.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises / H&S at Work Act 1974",
    });
  }

  if (vehicleCheckComplianceRate < 50 && totalVehicleChecks > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently address vehicle maintenance — the majority of vehicles are failing safety checks. Remove unsafe vehicles from service and arrange immediate inspections and repairs.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (insuranceCurrencyRate < 50 && totalVehicleChecks > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Immediately verify and renew insurance for all vehicles — transporting children in uninsured vehicles is a legal offence and a serious safeguarding failure.",
      urgency: "immediate",
      regulatory_ref: "Road Traffic Act 1988 / CHR 2015 Reg 25",
    });
  }

  if (seatbeltComplianceRate < 50 && totalTransportLogs > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement mandatory seatbelt checks on every journey — children's basic passenger safety must be assured and documented on each trip.",
      urgency: "immediate",
      regulatory_ref: "Health & Safety at Work Act 1974",
    });
  }

  if (motServiceCurrencyRate < 50 && totalVehicleChecks > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently arrange MOT and servicing for all overdue vehicles — vehicles without current MOT are not legally roadworthy and must not be used to transport children.",
      urgency: "immediate",
      regulatory_ref: "Road Traffic Act 1988 / CHR 2015 Reg 25",
    });
  }

  if (totalVehicleChecks === 0 && total_children > 0 && totalTransportLogs > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish a vehicle check regime immediately — implement weekly, monthly, and annual vehicle inspections to ensure all vehicles used to transport children are safe and roadworthy.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (totalDrivingRecords === 0 && total_children > 0 && totalTransportLogs > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Create driving records for all staff who transport children — verify licences, check expiry dates, confirm business insurance, and record advanced training status.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 / H&S at Work Act 1974",
    });
  }

  if (defectResolutionRate < 50 && totalDefectsFound > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a defect tracking and resolution system — all identified vehicle defects must be resolved before the vehicle is used to transport children.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (preUseCheckCompletionRate < 50 && totalPreUseChecks > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review and improve pre-use check procedures — staff must be trained to conduct thorough pre-journey vehicle safety checks and vehicles failing checks must not be used.",
      urgency: "immediate",
      regulatory_ref: "Health & Safety at Work Act 1974",
    });
  }

  if (riskAssessmentCompletionRate < 50 && totalTransportRAs > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve transport risk assessment quality — all assessments must identify specific control measures to mitigate identified risks.",
      urgency: "soon",
      regulatory_ref: "Health & Safety at Work Act 1974",
    });
  }

  if (totalTransportRAs === 0 && total_children > 0 && totalTransportLogs > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Introduce transport risk assessments for all journey types — assess risks for routine, high-risk, and ad-hoc journeys with appropriate control measures documented.",
      urgency: "soon",
      regulatory_ref: "Health & Safety at Work Act 1974",
    });
  }

  if (driverQualificationCurrencyRate >= 50 && driverQualificationCurrencyRate < 80 && totalDrivingRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase driver qualification compliance to at least 80% — verify and renew expired licences and ensure all drivers have current business insurance.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (vehicleCheckComplianceRate >= 50 && vehicleCheckComplianceRate < 80 && totalVehicleChecks > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve vehicle check pass rates to at least 80% — investigate recurring failure points and address maintenance issues systematically.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (journeyLogCompletionRate < 80 && journeyLogCompletionRate >= 50 && totalTransportLogs > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve journey log completion to at least 80% — ensure all transport records include purpose, mileage, and passenger details.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (seatbeltComplianceRate >= 50 && seatbeltComplianceRate < 90 && totalTransportLogs > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve seatbelt check documentation to at least 90% — embed seatbelt verification as a mandatory step in every journey record.",
      urgency: "planned",
      regulatory_ref: "Health & Safety at Work Act 1974",
    });
  }

  if (overdueRAs > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        `Review ${overdueRAs} overdue transport risk assessment${overdueRAs !== 1 ? "s" : ""} — risk assessments must be reviewed by their due date to ensure controls remain appropriate.`,
      urgency: "soon",
      regulatory_ref: "Health & Safety at Work Act 1974",
    });
  }

  if (businessInsuranceRate < 80 && totalDrivingRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all drivers have business insurance — staff using personal or work vehicles to transport children must have appropriate insurance cover.",
      urgency: "soon",
      regulatory_ref: "Road Traffic Act 1988",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: TransportSafetyInsight[] = [];

  // -- Critical insights --

  if (vehicleCheckComplianceRate < 50 && totalVehicleChecks > 0) {
    insights.push({
      text: `Only ${vehicleCheckComplianceRate}% of vehicle checks passed. Ofsted will view this as a failure to ensure children are transported in safe, roadworthy vehicles under Reg 25. Vehicles failing checks must be taken out of service immediately.`,
      severity: "critical",
    });
  }

  if (driverQualificationCurrencyRate < 50 && totalDrivingRecords > 0) {
    insights.push({
      text: `Only ${driverQualificationCurrencyRate}% of drivers have current, verified qualifications. Children may be transported by unqualified drivers, which is a serious safeguarding and legal risk. This requires immediate action.`,
      severity: "critical",
    });
  }

  if (insuranceCurrencyRate < 50 && totalVehicleChecks > 0) {
    insights.push({
      text: `Only ${insuranceCurrencyRate}% of vehicles have current insurance. Transporting children in uninsured vehicles is illegal and exposes both the children and the organisation to significant risk.`,
      severity: "critical",
    });
  }

  if (seatbeltComplianceRate < 50 && totalTransportLogs > 0) {
    insights.push({
      text: `Only ${seatbeltComplianceRate}% of journeys have documented seatbelt checks. This fundamental passenger safety measure is not being consistently applied, placing children at risk of injury in the event of a collision.`,
      severity: "critical",
    });
  }

  if (expiredLicences > 0) {
    insights.push({
      text: `${expiredLicences} staff member${expiredLicences !== 1 ? "s have" : " has"} expired driving licence${expiredLicences !== 1 ? "s" : ""}. Any staff member with an expired licence must immediately cease driving duties until their licence is renewed.`,
      severity: "critical",
    });
  }

  if (totalVehicleChecks === 0 && totalTransportLogs > 0) {
    insights.push({
      text: "Transport journeys are being made without any vehicle check records. The home cannot demonstrate that vehicles are safe and roadworthy — this is a fundamental gap in transport safety oversight.",
      severity: "critical",
    });
  }

  if (motServiceCurrencyRate < 50 && totalVehicleChecks > 0) {
    insights.push({
      text: `Only ${motServiceCurrencyRate}% of vehicles have current MOT and are within service schedule. Vehicles without valid MOT are not legal to drive on public roads and must not be used to transport children.`,
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (vehicleCheckComplianceRate >= 50 && vehicleCheckComplianceRate < 80 && totalVehicleChecks > 0) {
    insights.push({
      text: `Vehicle check compliance at ${vehicleCheckComplianceRate}% — improving but not yet meeting the expected standard. Investigate recurring failure points and establish a proactive maintenance schedule.`,
      severity: "warning",
    });
  }

  if (driverQualificationCurrencyRate >= 50 && driverQualificationCurrencyRate < 80 && totalDrivingRecords > 0) {
    insights.push({
      text: `Driver qualification currency at ${driverQualificationCurrencyRate}% — some staff lack verified, current driving credentials. Set up licence expiry tracking to prevent lapses.`,
      severity: "warning",
    });
  }

  if (preUseCheckCompletionRate >= 50 && preUseCheckCompletionRate < 80 && totalPreUseChecks > 0) {
    insights.push({
      text: `Pre-use check pass rate at ${preUseCheckCompletionRate}% — some vehicles are not passing daily safety checks. This may indicate recurring maintenance issues that need systematic attention.`,
      severity: "warning",
    });
  }

  if (riskAssessmentCompletionRate >= 50 && riskAssessmentCompletionRate < 70 && totalTransportRAs > 0) {
    insights.push({
      text: `Risk assessment completion at ${riskAssessmentCompletionRate}% — not all transport risk assessments identify appropriate controls. Without controls, risk assessments are procedural rather than protective.`,
      severity: "warning",
    });
  }

  if (defectResolutionRate >= 50 && defectResolutionRate < 70 && totalDefectsFound > 0) {
    insights.push({
      text: `Defect resolution at ${defectResolutionRate}% — a significant number of identified vehicle defects remain unresolved. Unresolved defects accumulate risk over time.`,
      severity: "warning",
    });
  }

  if (journeyLogCompletionRate >= 50 && journeyLogCompletionRate < 80 && totalTransportLogs > 0) {
    insights.push({
      text: `Journey log completion at ${journeyLogCompletionRate}% — incomplete logs limit the home's ability to account for all transport activity and could be an issue during regulatory inspection.`,
      severity: "warning",
    });
  }

  if (overdueRAs > 0 && overdueRAs <= 3) {
    insights.push({
      text: `${overdueRAs} transport risk assessment${overdueRAs !== 1 ? "s are" : " is"} overdue for review — prompt review is needed to ensure risk controls remain appropriate and effective.`,
      severity: "warning",
    });
  }

  if (overdueRAs > 3) {
    insights.push({
      text: `${overdueRAs} transport risk assessments are overdue for review — this volume suggests a systemic issue with risk assessment review scheduling.`,
      severity: "warning",
    });
  }

  if (highRiskRAs > 0 && highRiskWithControls < highRiskRAs) {
    insights.push({
      text: `${highRiskRAs - highRiskWithControls} of ${highRiskRAs} high-risk transport risk assessment${highRiskRAs !== 1 ? "s lack" : " lacks"} identified controls — high-risk journeys without documented controls must not proceed.`,
      severity: "warning",
    });
  }

  if (preUseIssues > 0 && totalPreUseChecks > 0) {
    const preUseIssueRate = pct(preUseIssues, totalPreUseChecks);
    if (preUseIssueRate >= 30 && preUseIssueRate < 50) {
      insights.push({
        text: `${preUseIssueRate}% of pre-use checks flagged at least one issue (lights, tyres, brakes, or fluids) — this rate suggests vehicles require more frequent maintenance attention.`,
        severity: "warning",
      });
    }
  }

  if (incidentLogs > 0) {
    insights.push({
      text: `${incidentLogs} transport journey${incidentLogs !== 1 ? "s" : ""} recorded incident${incidentLogs !== 1 ? "s" : ""} — each incident should be reviewed and learning embedded into transport practice.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (transport_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding transport and vehicle safety — vehicles are well maintained, drivers are qualified and verified, journeys are properly planned and documented, and children's safety during transport is comprehensively assured. This is strong evidence for Reg 25 and health and safety compliance.",
      severity: "positive",
    });
  }

  if (vehicleCheckComplianceRate >= 95 && preUseCheckCompletionRate >= 95 && totalVehicleChecks > 0 && totalPreUseChecks > 0) {
    insights.push({
      text: "Vehicle checks and pre-use inspections are both at excellent levels — the home has embedded a comprehensive vehicle safety culture covering both periodic and daily checks.",
      severity: "positive",
    });
  }

  if (driverQualificationCurrencyRate >= 95 && businessInsuranceRate >= 95 && totalDrivingRecords > 0) {
    insights.push({
      text: "Driver qualifications and business insurance are both at excellent levels — the home ensures staff are legally and professionally qualified to transport children.",
      severity: "positive",
    });
  }

  if (insuranceCurrencyRate >= 100 && motServiceCurrencyRate >= 100 && totalVehicleChecks > 0) {
    insights.push({
      text: "All vehicles have current insurance, MOT, and are within service schedules — the home maintains full legal and mechanical compliance for its entire fleet.",
      severity: "positive",
    });
  }

  if (seatbeltComplianceRate >= 100 && journeyLogCompletionRate >= 95 && totalTransportLogs > 0) {
    insights.push({
      text: "Seatbelt checks and journey logging are both at excellent levels — every journey is properly documented with passenger safety verified, demonstrating embedded safe transport practice.",
      severity: "positive",
    });
  }

  if (defectResolutionRate >= 90 && totalDefectsFound > 0) {
    insights.push({
      text: `${defectResolutionRate}% of vehicle defects resolved — the home responds promptly and effectively to maintenance issues, ensuring vehicles are kept in safe condition.`,
      severity: "positive",
    });
  }

  if (riskAssessmentCompletionRate >= 90 && totalTransportRAs > 0 && overdueRAs === 0) {
    insights.push({
      text: "Transport risk assessments are comprehensive and current — journey risks are systematically assessed with controls identified and reviews up to date.",
      severity: "positive",
    });
  }

  if (advancedTrainingRate >= 80 && totalDrivingRecords > 0) {
    insights.push({
      text: `${advancedTrainingRate}% of drivers have completed advanced driving training — the home invests beyond minimum requirements to enhance driver competence and children's safety during transport.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (transport_rating === "outstanding") {
    headline =
      "Outstanding transport and vehicle safety — vehicles are well maintained, drivers are qualified, and children's safety during transport is comprehensively assured.";
  } else if (transport_rating === "good") {
    headline = `Good transport and vehicle safety — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (transport_rating === "adequate") {
    headline = `Adequate transport and vehicle safety — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure children are transported safely.`;
  } else {
    headline = `Transport and vehicle safety is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure children are transported safely.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    transport_rating,
    transport_score: score,
    headline,
    total_transport_logs: totalTransportLogs,
    vehicle_check_compliance_rate: vehicleCheckComplianceRate,
    pre_use_check_completion_rate: preUseCheckCompletionRate,
    driver_qualification_currency_rate: driverQualificationCurrencyRate,
    risk_assessment_completion_rate: riskAssessmentCompletionRate,
    journey_log_completion_rate: journeyLogCompletionRate,
    seatbelt_compliance_rate: seatbeltComplianceRate,
    insurance_currency_rate: insuranceCurrencyRate,
    mot_service_currency_rate: motServiceCurrencyRate,
    defect_resolution_rate: defectResolutionRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
