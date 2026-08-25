import { below, meets, rate } from "@/lib/metrics/rate";
// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME ELECTRICITY & GAS SAFETY INTELLIGENCE ENGINE
// Monitors PAT testing compliance, gas safety certificate currency, electrical
// inspection schedules, carbon monoxide detector checks, child safety awareness,
// and staff training in electrical and gas safety procedures.
// Measures pat_testing_rate, gas_certificate_rate, electrical_inspection_rate,
// co_detector_rate, child_safety_rate, staff_training_rate across the home.
// Pure deterministic engine — no imports, no LLM, no external deps.
// Ofsted CHR 2015 Reg 25 (Premises and safety), SCCIF safety standards.
// Store keys: patTestingRecords, gasCertificateRecords, electricalInspectionRecords,
//             coDetectorRecords, childSafetyRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface PatTestingInput {
  id: string;
  appliance_id: string;
  appliance_name: string;
  appliance_location: string;
  appliance_category: "class_1" | "class_2" | "class_3" | "it_equipment" | "portable" | "fixed" | "other";
  test_date: string;
  next_test_due: string | null;
  test_overdue: boolean;
  result: "pass" | "fail" | "advisory";
  tester_name: string;
  tester_qualified: boolean;
  visual_inspection_passed: boolean;
  earth_continuity_passed: boolean;
  insulation_resistance_passed: boolean;
  polarity_correct: boolean;
  label_attached: boolean;
  defect_found: boolean;
  defect_description: string | null;
  defect_resolved: boolean;
  removed_from_service: boolean;
  risk_rating: "low" | "medium" | "high";
  child_accessible: boolean;
  created_at: string;
}

export interface GasCertificateInput {
  id: string;
  certificate_type: "cp12" | "landlord_safety" | "boiler_service" | "gas_cooker" | "gas_fire" | "gas_installation" | "other";
  appliance_name: string;
  appliance_location: string;
  engineer_name: string;
  gas_safe_registration: string;
  inspection_date: string;
  expiry_date: string | null;
  expired: boolean;
  result: "satisfactory" | "at_risk" | "immediately_dangerous" | "not_to_current_standards";
  defects_found: boolean;
  defect_description: string | null;
  defect_rectified: boolean;
  warning_notice_issued: boolean;
  flue_checked: boolean;
  ventilation_adequate: boolean;
  gas_tightness_tested: boolean;
  operating_pressure_correct: boolean;
  safety_device_operational: boolean;
  co_reading_acceptable: boolean;
  created_at: string;
}

export interface ElectricalInspectionInput {
  id: string;
  inspection_type: "eicr" | "emergency_lighting" | "rcd_test" | "fire_alarm" | "fixed_wiring" | "portable_generator" | "other";
  area_inspected: string;
  inspector_name: string;
  inspector_qualified: boolean;
  inspection_date: string;
  next_inspection_due: string | null;
  inspection_overdue: boolean;
  result: "satisfactory" | "unsatisfactory" | "further_investigation" | "improvement_required";
  c1_defects: number; // danger present
  c2_defects: number; // potentially dangerous
  c3_defects: number; // improvement recommended
  fi_defects: number; // further investigation
  defects_rectified: number;
  total_defects: number;
  all_defects_resolved: boolean;
  distribution_board_satisfactory: boolean;
  earthing_satisfactory: boolean;
  bonding_satisfactory: boolean;
  rcd_tested: boolean;
  rcd_operating_correctly: boolean;
  certificate_issued: boolean;
  created_at: string;
}

export interface CoDetectorInput {
  id: string;
  detector_location: string;
  detector_type: "sealed_battery" | "battery" | "mains_wired" | "plug_in" | "combined_smoke_co";
  install_date: string;
  expiry_date: string | null;
  expired: boolean;
  last_test_date: string | null;
  test_overdue: boolean;
  test_result: "pass" | "fail" | "not_tested";
  battery_status: "good" | "low" | "dead" | "mains_powered";
  near_gas_appliance: boolean;
  near_sleeping_area: boolean;
  audible_from_bedrooms: boolean;
  functioning: boolean;
  replacement_due: boolean;
  positioned_correctly: boolean;
  child_aware_of_alarm: boolean;
  last_activation_date: string | null;
  false_alarm_count: number;
  created_at: string;
}

export interface ChildSafetyInput {
  id: string;
  child_id: string;
  child_name: string;
  awareness_type: "electrical_safety" | "gas_safety" | "co_awareness" | "fire_safety" | "appliance_use" | "emergency_procedure";
  assessment_date: string;
  assessed_by: string;
  knowledge_score: number | null; // 1-10
  practical_demonstration: boolean;
  can_identify_hazards: boolean;
  knows_emergency_procedure: boolean;
  knows_how_to_report: boolean;
  age_appropriate_understanding: boolean;
  review_date: string | null;
  review_overdue: boolean;
  additional_support_needed: boolean;
  support_provided: boolean;
  child_engaged_in_session: boolean;
  created_at: string;
}

export interface ElectricityGasSafetyInput {
  today: string;
  total_children: number;
  total_staff: number;
  pat_testing_records: PatTestingInput[];
  gas_certificate_records: GasCertificateInput[];
  electrical_inspection_records: ElectricalInspectionInput[];
  co_detector_records: CoDetectorInput[];
  child_safety_records: ChildSafetyInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type ElectricityGasSafetyRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface ElectricityGasSafetyInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface ElectricityGasSafetyRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface ElectricityGasSafetyResult {
  electrical_rating: ElectricityGasSafetyRating;
  electrical_score: number | null;
  headline: string;
  total_appliances_tested: number;
  pat_testing_rate: number | null;
  gas_certificate_rate: number | null;
  electrical_inspection_rate: number | null;
  co_detector_rate: number | null;
  child_safety_rate: number | null;
  staff_training_rate: number | null;
  pat_pass_rate: number | null;
  gas_satisfactory_rate: number | null;
  electrical_satisfactory_rate: number | null;
  co_functioning_rate: number | null;
  defect_resolution_rate: number | null;
  strengths: string[];
  concerns: string[];
  recommendations: ElectricityGasSafetyRecommendation[];
  insights: ElectricityGasSafetyInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): ElectricityGasSafetyRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: ElectricityGasSafetyRating,
  score: number,
  headline: string,
): ElectricityGasSafetyResult {
  return {
    electrical_rating: rating,
    electrical_score: score,
    headline,
    total_appliances_tested: 0,
    pat_testing_rate: null,
    gas_certificate_rate: null,
    electrical_inspection_rate: null,
    co_detector_rate: null,
    child_safety_rate: null,
    staff_training_rate: null,
    pat_pass_rate: null,
    gas_satisfactory_rate: null,
    electrical_satisfactory_rate: null,
    co_functioning_rate: null,
    defect_resolution_rate: null,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeElectricityGasSafety(
  input: ElectricityGasSafetyInput,
): ElectricityGasSafetyResult {
  const {
    total_children,
    total_staff,
    pat_testing_records,
    gas_certificate_records,
    electrical_inspection_records,
    co_detector_records,
    child_safety_records,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    pat_testing_records.length === 0 &&
    gas_certificate_records.length === 0 &&
    electrical_inspection_records.length === 0 &&
    co_detector_records.length === 0 &&
    child_safety_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess electricity and gas safety.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No electricity or gas safety data recorded despite children on placement — electrical and gas safety compliance requires urgent attention.",
      ),
      concerns: [
        "No PAT testing records, gas safety certificates, electrical inspections, CO detector checks, or child safety awareness records exist despite children being on placement — the home cannot evidence compliance with basic electrical and gas safety obligations.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Immediately commission PAT testing of all portable electrical appliances and obtain current gas safety certificates for all gas appliances. Children's safety depends on verified electrical and gas safety compliance.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
        },
        {
          rank: 2,
          recommendation:
            "Install and test carbon monoxide detectors in all rooms with gas appliances and near sleeping areas. Ensure all children are made aware of CO alarm sounds and emergency procedures.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
        },
      ],
      insights: [
        {
          text: "The complete absence of electrical and gas safety records means the home cannot demonstrate that children are protected from electrical and gas hazards. Ofsted considers premises safety under Reg 25 a fundamental requirement, and the absence of any safety testing records represents a serious regulatory compliance failure.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- PAT Testing ---
  const totalPatRecords = pat_testing_records.length;
  const patCurrentRecords = pat_testing_records.filter((p) => !p.test_overdue);
  const patTestingRate = rate(patCurrentRecords.length, totalPatRecords);

  const patPassRecords = pat_testing_records.filter((p) => p.result === "pass");
  const patPassRate = rate(patPassRecords.length, totalPatRecords);

  const patFailRecords = pat_testing_records.filter((p) => p.result === "fail");
  const patFailCount = patFailRecords.length;

  const patOverdueCount = pat_testing_records.filter((p) => p.test_overdue).length;

  const patDefectRecords = pat_testing_records.filter((p) => p.defect_found);
  const patDefectCount = patDefectRecords.length;
  const patDefectsResolved = patDefectRecords.filter((p) => p.defect_resolved).length;
  const patDefectResolutionRate = rate(patDefectsResolved, patDefectCount);

  const patHighRiskCount = pat_testing_records.filter((p) => p.risk_rating === "high").length;

  const patChildAccessibleFailed = pat_testing_records.filter(
    (p) => p.child_accessible && (p.result === "fail" || p.defect_found),
  ).length;

  const patQualifiedTesterRate = rate(
    pat_testing_records.filter((p) => p.tester_qualified).length,
    totalPatRecords,
  );

  const patLabelRate = rate(
    pat_testing_records.filter((p) => p.label_attached).length,
    totalPatRecords,
  );

  // --- Gas Safety Certificates ---
  const totalGasRecords = gas_certificate_records.length;
  const gasCurrentRecords = gas_certificate_records.filter((g) => !g.expired);
  const gasCertificateRate = rate(gasCurrentRecords.length, totalGasRecords);

  const gasSatisfactoryRecords = gas_certificate_records.filter(
    (g) => g.result === "satisfactory",
  );
  const gasSatisfactoryRate = rate(gasSatisfactoryRecords.length, totalGasRecords);

  const gasExpiredCount = gas_certificate_records.filter((g) => g.expired).length;

  const gasImmediatelyDangerous = gas_certificate_records.filter(
    (g) => g.result === "immediately_dangerous",
  ).length;

  const gasAtRisk = gas_certificate_records.filter(
    (g) => g.result === "at_risk",
  ).length;

  const gasWarningNotices = gas_certificate_records.filter(
    (g) => g.warning_notice_issued,
  ).length;

  const gasDefectsFound = gas_certificate_records.filter((g) => g.defects_found).length;
  const gasDefectsRectified = gas_certificate_records.filter(
    (g) => g.defects_found && g.defect_rectified,
  ).length;
  const gasDefectResolutionRate = rate(gasDefectsRectified, gasDefectsFound);

  const gasFlueCheckedRate = rate(
    gas_certificate_records.filter((g) => g.flue_checked).length,
    totalGasRecords,
  );

  const gasVentilationRate = rate(
    gas_certificate_records.filter((g) => g.ventilation_adequate).length,
    totalGasRecords,
  );

  const gasSafetyDeviceRate = rate(
    gas_certificate_records.filter((g) => g.safety_device_operational).length,
    totalGasRecords,
  );

  const gasCoReadingRate = rate(
    gas_certificate_records.filter((g) => g.co_reading_acceptable).length,
    totalGasRecords,
  );

  // --- Electrical Inspections ---
  const totalElectricalRecords = electrical_inspection_records.length;
  const electricalCurrentRecords = electrical_inspection_records.filter(
    (e) => !e.inspection_overdue,
  );
  const electricalInspectionRate = rate(electricalCurrentRecords.length, totalElectricalRecords);

  const electricalSatisfactoryRecords = electrical_inspection_records.filter(
    (e) => e.result === "satisfactory",
  );
  const electricalSatisfactoryRate = rate(electricalSatisfactoryRecords.length, totalElectricalRecords);

  const electricalOverdueCount = electrical_inspection_records.filter(
    (e) => e.inspection_overdue,
  ).length;

  const totalC1Defects = electrical_inspection_records.reduce((sum, e) => sum + e.c1_defects, 0);
  const totalC2Defects = electrical_inspection_records.reduce((sum, e) => sum + e.c2_defects, 0);
  const totalC3Defects = electrical_inspection_records.reduce((sum, e) => sum + e.c3_defects, 0);
  const totalFiDefects = electrical_inspection_records.reduce((sum, e) => sum + e.fi_defects, 0);

  const totalElectricalDefects = electrical_inspection_records.reduce(
    (sum, e) => sum + e.total_defects,
    0,
  );
  const totalElectricalDefectsRectified = electrical_inspection_records.reduce(
    (sum, e) => sum + e.defects_rectified,
    0,
  );
  const electricalDefectResolutionRate = rate(totalElectricalDefectsRectified, totalElectricalDefects);

  const rcdTestedRate = rate(
    electrical_inspection_records.filter((e) => e.rcd_tested).length,
    totalElectricalRecords,
  );

  const rcdOperatingRate = rate(
    electrical_inspection_records.filter((e) => e.rcd_operating_correctly).length,
    totalElectricalRecords,
  );

  const earthingRate = rate(
    electrical_inspection_records.filter((e) => e.earthing_satisfactory).length,
    totalElectricalRecords,
  );

  const bondingRate = rate(
    electrical_inspection_records.filter((e) => e.bonding_satisfactory).length,
    totalElectricalRecords,
  );

  // --- CO Detectors ---
  const totalCoDetectors = co_detector_records.length;
  const coFunctioningRecords = co_detector_records.filter((c) => c.functioning);
  const coFunctioningRate = rate(coFunctioningRecords.length, totalCoDetectors);

  const coTestedCurrent = co_detector_records.filter((c) => !c.test_overdue);
  const coDetectorRate = rate(coTestedCurrent.length, totalCoDetectors);

  const coNotFunctioningCount = co_detector_records.filter((c) => !c.functioning).length;

  const coNearGasRate = rate(
    co_detector_records.filter((c) => c.near_gas_appliance).length,
    totalCoDetectors,
  );

  const coNearSleepingRate = rate(
    co_detector_records.filter((c) => c.near_sleeping_area).length,
    totalCoDetectors,
  );

  const coAudibleRate = rate(
    co_detector_records.filter((c) => c.audible_from_bedrooms).length,
    totalCoDetectors,
  );

  const coPositionedCorrectlyRate = rate(
    co_detector_records.filter((c) => c.positioned_correctly).length,
    totalCoDetectors,
  );

  const coBatteryLowOrDead = co_detector_records.filter(
    (c) => c.battery_status === "low" || c.battery_status === "dead",
  ).length;

  const coChildAwareRate = rate(
    co_detector_records.filter((c) => c.child_aware_of_alarm).length,
    totalCoDetectors,
  );

  const coReplacementDueCount = co_detector_records.filter((c) => c.replacement_due).length;

  const coFailedTests = co_detector_records.filter((c) => c.test_result === "fail").length;

  // --- Child Safety Awareness ---
  const totalChildSafetyRecords = child_safety_records.length;
  const uniqueChildrenAssessed = new Set(child_safety_records.map((c) => c.child_id)).size;
  const childSafetyRate = total_children > 0 ? rate(uniqueChildrenAssessed, total_children) : 0;

  const childKnowledgeScores = child_safety_records.map((c) => c.knowledge_score).filter((s): s is number => s !== null);
  const avgKnowledgeScore =
    childKnowledgeScores.length > 0
      ? Math.round(
          (childKnowledgeScores.reduce((sum: number, s: number) => sum + s, 0) / childKnowledgeScores.length) * 100,
        ) / 100
      : null;

  const practicalDemoRate = rate(
    child_safety_records.filter((c) => c.practical_demonstration).length,
    totalChildSafetyRecords,
  );

  const hazardIdentificationRate = rate(
    child_safety_records.filter((c) => c.can_identify_hazards).length,
    totalChildSafetyRecords,
  );

  const emergencyProcedureRate = rate(
    child_safety_records.filter((c) => c.knows_emergency_procedure).length,
    totalChildSafetyRecords,
  );

  const childSafetyReviewOverdueCount = child_safety_records.filter(
    (c) => c.review_overdue,
  ).length;

  const additionalSupportNeeded = child_safety_records.filter(
    (c) => c.additional_support_needed,
  ).length;
  const additionalSupportProvided = child_safety_records.filter(
    (c) => c.additional_support_needed && c.support_provided,
  ).length;
  const supportProvisionRate = rate(additionalSupportProvided, additionalSupportNeeded);

  const childEngagementRate = rate(
    child_safety_records.filter((c) => c.child_engaged_in_session).length,
    totalChildSafetyRecords,
  );

  // --- Staff Training Rate (derived from child safety records assessor diversity) ---
  // Staff training rate is approximated from how many unique assessors (staff) have conducted
  // safety awareness sessions — more diverse assessors = broader staff competency
  const uniqueAssessors = new Set(child_safety_records.map((c) => c.assessed_by)).size;
  const staffTrainingRate = total_staff > 0 ? clamp(rate(uniqueAssessors, total_staff)!, 0, 100) : null;

  // --- Composite Defect Resolution Rate ---
  const totalDefectsAll = patDefectCount + gasDefectsFound + totalElectricalDefects;
  const totalResolvedAll = patDefectsResolved + gasDefectsRectified + totalElectricalDefectsRectified;
  const defectResolutionRate = rate(totalResolvedAll, totalDefectsAll);

  // ── Scoring: base 52 ─────────────────────────────────────────────────

  let score = 52;

  // --- Bonus 1: patTestingRate (>=100: +5, >=80: +3) ---
  if (meets(patTestingRate, 100)) score += 5;
  else if (meets(patTestingRate, 80)) score += 3;

  // --- Bonus 2: gasCertificateRate (>=100: +5, >=80: +3) ---
  if (meets(gasCertificateRate, 100)) score += 5;
  else if (meets(gasCertificateRate, 80)) score += 3;

  // --- Bonus 3: electricalInspectionRate (>=100: +5, >=80: +3) ---
  if (meets(electricalInspectionRate, 100)) score += 5;
  else if (meets(electricalInspectionRate, 80)) score += 3;

  // --- Bonus 4: coDetectorRate (>=100: +4, >=80: +2) ---
  if (meets(coDetectorRate, 100)) score += 4;
  else if (meets(coDetectorRate, 80)) score += 2;

  // --- Bonus 5: childSafetyRate (>=100: +4, >=80: +2) ---
  if (meets(childSafetyRate, 100)) score += 4;
  else if (meets(childSafetyRate, 80)) score += 2;

  // --- Bonus 6: staffTrainingRate (>=80: +3, >=60: +1) ---
  if (meets(staffTrainingRate, 80)) score += 3;
  else if (meets(staffTrainingRate, 60)) score += 1;

  // --- Bonus 7: defectResolutionRate (>=100: +2, >=80: +1) ---
  if (meets(defectResolutionRate, 100)) score += 2;
  else if (meets(defectResolutionRate, 80)) score += 1;

  // ── Penalties (4 guarded) ─────────────────────────────────────────────

  // Penalty 1: patTestingRate < 50 → -6 (guarded by totalPatRecords > 0)
  if (below(patTestingRate, 50) && totalPatRecords > 0) score -= 6;

  // Penalty 2: gasCertificateRate < 50 → -6 (guarded by totalGasRecords > 0)
  if (below(gasCertificateRate, 50) && totalGasRecords > 0) score -= 6;

  // Penalty 3: electricalInspectionRate < 50 → -5 (guarded by totalElectricalRecords > 0)
  if (below(electricalInspectionRate, 50) && totalElectricalRecords > 0) score -= 5;

  // Penalty 4: coDetectorRate < 50 → -5 (guarded by totalCoDetectors > 0)
  if (below(coDetectorRate, 50) && totalCoDetectors > 0) score -= 5;

  score = clamp(score, 0, 100);

  const electrical_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  // PAT testing strengths
  if (meets(patTestingRate, 100) && totalPatRecords > 0) {
    strengths.push(
      "All portable appliance testing is current — every item has been tested within schedule, demonstrating comprehensive electrical safety compliance.",
    );
  } else if (meets(patTestingRate, 80) && totalPatRecords > 0) {
    strengths.push(
      `${patTestingRate}% of PAT testing is current — the home maintains strong portable appliance testing compliance.`,
    );
  }

  if (meets(patPassRate, 100) && totalPatRecords > 0) {
    strengths.push(
      "Every appliance has passed PAT testing — no electrical safety defects identified across the home's portable appliances.",
    );
  } else if (meets(patPassRate, 90) && totalPatRecords > 0) {
    strengths.push(
      `${patPassRate}% PAT pass rate — the vast majority of portable appliances meet safety standards.`,
    );
  }

  if (meets(patQualifiedTesterRate, 100) && totalPatRecords > 0) {
    strengths.push(
      "All PAT testing carried out by qualified testers — the home ensures electrical testing is conducted by competent persons.",
    );
  }

  if (meets(patLabelRate, 100) && totalPatRecords > 0) {
    strengths.push(
      "All tested appliances have current labels attached — clear visual identification of testing status supports ongoing safety monitoring.",
    );
  }

  if (meets(patDefectResolutionRate, 100) && patDefectCount > 0) {
    strengths.push(
      "All PAT defects have been resolved — the home addresses electrical defects promptly to maintain safety.",
    );
  }

  // Gas safety strengths
  if (meets(gasCertificateRate, 100) && totalGasRecords > 0) {
    strengths.push(
      "All gas safety certificates are current — the home maintains full compliance with gas safety regulations.",
    );
  } else if (meets(gasCertificateRate, 80) && totalGasRecords > 0) {
    strengths.push(
      `${gasCertificateRate}% of gas safety certificates are current — strong gas safety compliance across the home.`,
    );
  }

  if (meets(gasSatisfactoryRate, 100) && totalGasRecords > 0) {
    strengths.push(
      "All gas appliances rated satisfactory — every gas appliance in the home meets safety standards.",
    );
  } else if (meets(gasSatisfactoryRate, 90) && totalGasRecords > 0) {
    strengths.push(
      `${gasSatisfactoryRate}% of gas appliances rated satisfactory — the home maintains gas appliances to a high standard.`,
    );
  }

  if (meets(gasFlueCheckedRate, 100) && totalGasRecords > 0) {
    strengths.push(
      "All gas appliance flues have been checked — comprehensive flue inspection reduces the risk of carbon monoxide exposure.",
    );
  }

  if (meets(gasSafetyDeviceRate, 100) && totalGasRecords > 0) {
    strengths.push(
      "All gas safety devices are operational — the home ensures every safety mechanism is functioning correctly.",
    );
  }

  if (meets(gasDefectResolutionRate, 100) && gasDefectsFound > 0) {
    strengths.push(
      "All gas defects have been rectified — the home responds promptly to identified gas safety issues.",
    );
  }

  // Electrical inspection strengths
  if (meets(electricalInspectionRate, 100) && totalElectricalRecords > 0) {
    strengths.push(
      "All electrical inspections are current — the home maintains comprehensive compliance with fixed wiring and installation safety requirements.",
    );
  } else if (meets(electricalInspectionRate, 80) && totalElectricalRecords > 0) {
    strengths.push(
      `${electricalInspectionRate}% of electrical inspections current — strong compliance with electrical safety inspection schedules.`,
    );
  }

  if (meets(electricalSatisfactoryRate, 100) && totalElectricalRecords > 0) {
    strengths.push(
      "All electrical inspections rated satisfactory — the home's electrical installations meet current safety standards.",
    );
  } else if (meets(electricalSatisfactoryRate, 90) && totalElectricalRecords > 0) {
    strengths.push(
      `${electricalSatisfactoryRate}% of electrical inspections rated satisfactory — electrical installations are generally in good condition.`,
    );
  }

  if (meets(rcdTestedRate, 100) && meets(rcdOperatingRate, 100) && totalElectricalRecords > 0) {
    strengths.push(
      "All RCDs tested and operating correctly — residual current devices provide critical protection against electrical shock.",
    );
  }

  if (meets(electricalDefectResolutionRate, 100) && totalElectricalDefects > 0) {
    strengths.push(
      "All electrical defects have been rectified — the home resolves identified electrical issues promptly.",
    );
  }

  if (meets(earthingRate, 100) && meets(bondingRate, 100) && totalElectricalRecords > 0) {
    strengths.push(
      "Earthing and bonding satisfactory across all inspections — fundamental electrical safety measures are in place throughout the home.",
    );
  }

  // CO detector strengths
  if (meets(coDetectorRate, 100) && totalCoDetectors > 0) {
    strengths.push(
      "All carbon monoxide detectors are tested and current — the home maintains comprehensive CO detection coverage.",
    );
  } else if (meets(coDetectorRate, 80) && totalCoDetectors > 0) {
    strengths.push(
      `${coDetectorRate}% of CO detectors tested and current — strong carbon monoxide detection compliance.`,
    );
  }

  if (meets(coFunctioningRate, 100) && totalCoDetectors > 0) {
    strengths.push(
      "All carbon monoxide detectors are functioning — complete CO detection protection across the home.",
    );
  }

  if (meets(coPositionedCorrectlyRate, 100) && totalCoDetectors > 0) {
    strengths.push(
      "All CO detectors are correctly positioned — proper placement maximises detection effectiveness and early warning capability.",
    );
  }

  if (meets(coNearSleepingRate, 80) && totalCoDetectors > 0) {
    strengths.push(
      `${coNearSleepingRate}% of CO detectors positioned near sleeping areas — the home prioritises protection of children during sleep.`,
    );
  }

  if (meets(coChildAwareRate, 100) && totalCoDetectors > 0) {
    strengths.push(
      "All children are aware of CO alarm sounds — children know what to do when a carbon monoxide alarm activates.",
    );
  }

  // Child safety awareness strengths
  if (meets(childSafetyRate, 100) && total_children > 0) {
    strengths.push(
      "Every child has received electrical and gas safety awareness assessment — the home ensures all children understand safety risks and emergency procedures.",
    );
  } else if (meets(childSafetyRate, 80) && total_children > 0) {
    strengths.push(
      `${childSafetyRate}% of children have received safety awareness assessment — strong coverage of safety education across the home.`,
    );
  }

  if ((avgKnowledgeScore ?? 0) >= 8.0 && totalChildSafetyRecords > 0) {
    strengths.push(
      `Average child safety knowledge score ${avgKnowledgeScore}/10 — children demonstrate excellent understanding of electrical and gas safety.`,
    );
  } else if ((avgKnowledgeScore ?? 0) >= 6.0 && totalChildSafetyRecords > 0) {
    strengths.push(
      `Average child safety knowledge score ${avgKnowledgeScore}/10 — children generally demonstrate good safety understanding.`,
    );
  }

  if (meets(emergencyProcedureRate, 100) && totalChildSafetyRecords > 0) {
    strengths.push(
      "Every assessed child knows the emergency procedures for electrical and gas safety — children can respond appropriately to safety incidents.",
    );
  }

  if (meets(hazardIdentificationRate, 90) && totalChildSafetyRecords > 0) {
    strengths.push(
      `${hazardIdentificationRate}% of children can identify electrical and gas hazards — the home builds strong safety awareness.`,
    );
  }

  if (meets(childEngagementRate, 90) && totalChildSafetyRecords > 0) {
    strengths.push(
      `${childEngagementRate}% child engagement in safety sessions — children are actively participating in learning about safety.`,
    );
  }

  if (meets(supportProvisionRate, 100) && additionalSupportNeeded > 0) {
    strengths.push(
      "All children identified as needing additional safety support have received it — the home ensures no child is left without tailored safety education.",
    );
  }

  // Staff training strengths
  if (meets(staffTrainingRate, 80) && total_staff > 0) {
    strengths.push(
      `${staffTrainingRate}% staff involvement in safety awareness delivery — a broad staff base is competent in electrical and gas safety education.`,
    );
  } else if (meets(staffTrainingRate, 60) && total_staff > 0) {
    strengths.push(
      `${staffTrainingRate}% staff involvement in safety sessions — a good proportion of staff actively deliver safety awareness to children.`,
    );
  }

  // Composite strengths
  if (meets(defectResolutionRate, 100) && totalDefectsAll > 0) {
    strengths.push(
      "Every identified defect across PAT, gas, and electrical domains has been resolved — the home demonstrates a zero-tolerance approach to safety defects.",
    );
  } else if (meets(defectResolutionRate, 90) && totalDefectsAll > 0) {
    strengths.push(
      `${defectResolutionRate}% overall defect resolution rate — the home addresses the vast majority of identified safety issues promptly.`,
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  // PAT testing concerns
  if (below(patTestingRate, 50) && totalPatRecords > 0) {
    concerns.push(
      `Only ${patTestingRate}% of PAT testing is current — the majority of portable appliances have overdue testing, creating significant electrical safety risk for children and staff.`,
    );
  } else if (below(patTestingRate, 80) && meets(patTestingRate, 50) && totalPatRecords > 0) {
    concerns.push(
      `PAT testing compliance at ${patTestingRate}% — some portable appliances have overdue testing. All appliances used in areas accessible to children must be tested within schedule.`,
    );
  }

  if (patFailCount > 0 && totalPatRecords > 0) {
    concerns.push(
      `${patFailCount} appliance${patFailCount !== 1 ? "s have" : " has"} failed PAT testing — failed appliances must be immediately removed from service and either repaired or replaced to prevent electrical injury.`,
    );
  }

  if (patHighRiskCount > 0) {
    concerns.push(
      `${patHighRiskCount} appliance${patHighRiskCount !== 1 ? "s" : ""} rated as high risk — high-risk items require priority attention and may need more frequent testing schedules.`,
    );
  }

  if (patChildAccessibleFailed > 0) {
    concerns.push(
      `${patChildAccessibleFailed} child-accessible appliance${patChildAccessibleFailed !== 1 ? "s have" : " has"} defects or failed testing — this represents an immediate risk to children's safety.`,
    );
  }

  if (below(patDefectResolutionRate, 80) && patDefectCount > 0) {
    concerns.push(
      `Only ${patDefectResolutionRate}% of PAT defects resolved — unresolved electrical defects pose ongoing risk. All defects must be addressed or the appliance removed from service.`,
    );
  }

  if (patOverdueCount > 0 && totalPatRecords > 0) {
    concerns.push(
      `${patOverdueCount} appliance${patOverdueCount !== 1 ? "s have" : " has"} overdue PAT testing — overdue testing means the safety status of these appliances is unknown.`,
    );
  }

  // Gas safety concerns
  if (below(gasCertificateRate, 50) && totalGasRecords > 0) {
    concerns.push(
      `Only ${gasCertificateRate}% of gas safety certificates are current — operating gas appliances without current safety certificates is a serious regulatory breach and an immediate risk to life.`,
    );
  } else if (below(gasCertificateRate, 80) && meets(gasCertificateRate, 50) && totalGasRecords > 0) {
    concerns.push(
      `Gas safety certificate compliance at ${gasCertificateRate}% — some gas appliances have expired certificates. All gas appliances must have current safety certification.`,
    );
  }

  if (gasImmediatelyDangerous > 0) {
    concerns.push(
      `${gasImmediatelyDangerous} gas appliance${gasImmediatelyDangerous !== 1 ? "s classified" : " classified"} as immediately dangerous — these appliances must be isolated and not used until made safe by a Gas Safe registered engineer.`,
    );
  }

  if (gasAtRisk > 0) {
    concerns.push(
      `${gasAtRisk} gas appliance${gasAtRisk !== 1 ? "s classified" : " classified"} as at risk — these appliances have safety concerns that must be addressed to prevent escalation to dangerous status.`,
    );
  }

  if (gasWarningNotices > 0) {
    concerns.push(
      `${gasWarningNotices} gas warning notice${gasWarningNotices !== 1 ? "s" : ""} issued — warning notices indicate serious safety concerns that require documented remedial action.`,
    );
  }

  if (gasExpiredCount > 0 && totalGasRecords > 0) {
    concerns.push(
      `${gasExpiredCount} gas safety certificate${gasExpiredCount !== 1 ? "s have" : " has"} expired — gas appliances without current certificates must not be used until re-certified.`,
    );
  }

  if (below(gasDefectResolutionRate, 80) && gasDefectsFound > 0) {
    concerns.push(
      `Only ${gasDefectResolutionRate}% of gas defects rectified — unresolved gas defects pose a carbon monoxide poisoning and explosion risk.`,
    );
  }

  if (below(gasCoReadingRate, 80) && totalGasRecords > 0) {
    concerns.push(
      `Only ${gasCoReadingRate}% of gas appliances have acceptable CO readings — elevated carbon monoxide readings indicate incomplete combustion and potential poisoning risk.`,
    );
  }

  // Electrical inspection concerns
  if (below(electricalInspectionRate, 50) && totalElectricalRecords > 0) {
    concerns.push(
      `Only ${electricalInspectionRate}% of electrical inspections are current — the majority of electrical installations have overdue inspections, meaning the safety of the home's fixed wiring is unverified.`,
    );
  } else if (below(electricalInspectionRate, 80) && meets(electricalInspectionRate, 50) && totalElectricalRecords > 0) {
    concerns.push(
      `Electrical inspection compliance at ${electricalInspectionRate}% — some inspections are overdue. Fixed wiring inspections are essential for ongoing electrical safety.`,
    );
  }

  if (totalC1Defects > 0) {
    concerns.push(
      `${totalC1Defects} C1 (danger present) defect${totalC1Defects !== 1 ? "s" : ""} identified — C1 defects represent immediate danger and must be rectified as an emergency priority.`,
    );
  }

  if (totalC2Defects > 0) {
    concerns.push(
      `${totalC2Defects} C2 (potentially dangerous) defect${totalC2Defects !== 1 ? "s" : ""} identified — C2 defects require urgent remedial action to prevent them becoming dangerous.`,
    );
  }

  if (below(electricalDefectResolutionRate, 80) && totalElectricalDefects > 0) {
    concerns.push(
      `Only ${electricalDefectResolutionRate}% of electrical defects rectified — outstanding electrical defects compromise the safety of the home's electrical installation.`,
    );
  }

  if (below(rcdOperatingRate, 80) && totalElectricalRecords > 0) {
    concerns.push(
      `Only ${rcdOperatingRate}% of RCDs operating correctly — residual current devices are a critical safety measure and non-functioning RCDs leave occupants unprotected from electrical shock.`,
    );
  }

  if (electricalOverdueCount > 0 && totalElectricalRecords > 0) {
    concerns.push(
      `${electricalOverdueCount} electrical inspection${electricalOverdueCount !== 1 ? "s are" : " is"} overdue — the home cannot evidence ongoing electrical safety without current inspections.`,
    );
  }

  // CO detector concerns
  if (below(coDetectorRate, 50) && totalCoDetectors > 0) {
    concerns.push(
      `Only ${coDetectorRate}% of CO detectors have current testing — the majority of carbon monoxide detectors are not verified as functional, leaving children at risk of undetected CO exposure.`,
    );
  } else if (below(coDetectorRate, 80) && meets(coDetectorRate, 50) && totalCoDetectors > 0) {
    concerns.push(
      `CO detector testing compliance at ${coDetectorRate}% — some detectors have overdue testing. All CO detectors must be tested regularly to ensure they will activate in an emergency.`,
    );
  }

  if (coNotFunctioningCount > 0) {
    concerns.push(
      `${coNotFunctioningCount} CO detector${coNotFunctioningCount !== 1 ? "s are" : " is"} not functioning — non-functional detectors provide zero protection against carbon monoxide poisoning.`,
    );
  }

  if (coBatteryLowOrDead > 0) {
    concerns.push(
      `${coBatteryLowOrDead} CO detector${coBatteryLowOrDead !== 1 ? "s have" : " has"} low or dead batteries — battery-powered detectors are rendered useless without adequate battery power.`,
    );
  }

  if (coReplacementDueCount > 0) {
    concerns.push(
      `${coReplacementDueCount} CO detector${coReplacementDueCount !== 1 ? "s are" : " is"} due for replacement — CO detectors have a finite lifespan and must be replaced to maintain protection.`,
    );
  }

  if (coFailedTests > 0) {
    concerns.push(
      `${coFailedTests} CO detector${coFailedTests !== 1 ? "s have" : " has"} failed testing — failed detectors must be replaced immediately to restore carbon monoxide protection.`,
    );
  }

  if (below(coPositionedCorrectlyRate, 80) && totalCoDetectors > 0) {
    concerns.push(
      `Only ${coPositionedCorrectlyRate}% of CO detectors positioned correctly — incorrectly positioned detectors may not detect CO in time to provide adequate warning.`,
    );
  }

  // Child safety awareness concerns
  if (below(childSafetyRate, 50) && total_children > 0) {
    concerns.push(
      `Only ${childSafetyRate}% of children have received safety awareness assessment — the majority of children may not understand electrical and gas safety risks or know how to respond in an emergency.`,
    );
  } else if (below(childSafetyRate, 80) && meets(childSafetyRate, 50) && total_children > 0) {
    concerns.push(
      `Child safety awareness coverage at ${childSafetyRate}% — some children have not received electrical and gas safety education. All children should be aware of safety risks appropriate to their age.`,
    );
  }

  if ((avgKnowledgeScore ?? 0) < 4.0 && totalChildSafetyRecords > 0) {
    concerns.push(
      `Average child safety knowledge score only ${avgKnowledgeScore}/10 — children generally lack adequate understanding of electrical and gas safety, requiring intensified safety education.`,
    );
  } else if ((avgKnowledgeScore ?? 0) < 6.0 && (avgKnowledgeScore ?? 0) >= 4.0 && totalChildSafetyRecords > 0) {
    concerns.push(
      `Average child safety knowledge score ${avgKnowledgeScore}/10 — children's safety understanding needs strengthening to ensure they can protect themselves from hazards.`,
    );
  }

  if (below(emergencyProcedureRate, 70) && totalChildSafetyRecords > 0) {
    concerns.push(
      `Only ${emergencyProcedureRate}% of children know emergency procedures — children must understand what to do in an electrical or gas emergency to protect themselves and others.`,
    );
  }

  if (childSafetyReviewOverdueCount > 0 && totalChildSafetyRecords > 0) {
    concerns.push(
      `${childSafetyReviewOverdueCount} child safety awareness review${childSafetyReviewOverdueCount !== 1 ? "s are" : " is"} overdue — safety awareness must be regularly refreshed, particularly as children develop and their risk profile changes.`,
    );
  }

  if (below(supportProvisionRate, 80) && additionalSupportNeeded > 0) {
    concerns.push(
      `Only ${supportProvisionRate}% of children needing additional safety support have received it — where additional support needs are identified, they must be met to ensure children's safety.`,
    );
  }

  // Staff training concerns
  if (below(staffTrainingRate, 40) && total_staff > 0) {
    concerns.push(
      `Only ${staffTrainingRate}% of staff have delivered safety awareness sessions — limited staff involvement in safety education suggests gaps in staff competency in electrical and gas safety.`,
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: ElectricityGasSafetyRecommendation[] = [];
  let rank = 0;

  // Immediate recommendations
  if (gasImmediatelyDangerous > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Immediately isolate all gas appliances classified as immediately dangerous — these appliances must not be used under any circumstances until made safe by a Gas Safe registered engineer. Document isolation and notify Ofsted if the defect impacts on children's safety.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  if (totalC1Defects > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Rectify all C1 (danger present) electrical defects as an emergency — C1 defects represent an immediate risk of injury or death from electric shock or fire. Engage a qualified electrician urgently and document all remedial work.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  if (coNotFunctioningCount > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Immediately replace or repair all non-functioning carbon monoxide detectors — children are at risk of undetected CO exposure which can be fatal. Ensure functional CO detection in every room with a gas appliance and near all sleeping areas.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  if (patChildAccessibleFailed > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Immediately remove from service all child-accessible appliances that have failed PAT testing or have defects — children must not have access to electrically unsafe equipment under any circumstances.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  if (below(gasCertificateRate, 50) && totalGasRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently obtain current gas safety certificates for all gas appliances — operating gas appliances without valid safety certificates breaches legal requirements and endangers the lives of children and staff.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  if (below(patTestingRate, 50) && totalPatRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently schedule PAT testing for all overdue portable appliances — untested appliances represent unknown electrical risks. Commission a competent person to test all portable electrical equipment.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  if (below(electricalInspectionRate, 50) && totalElectricalRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently schedule overdue electrical inspections — the home cannot evidence the safety of its fixed electrical installations without current inspection certificates. Commission a qualified electrician for EICR testing.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  if (below(coDetectorRate, 50) && totalCoDetectors > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Immediately test all carbon monoxide detectors and replace any that fail — CO detection is a critical life-safety measure. Implement a monthly testing schedule and document all checks.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  if (totalC2Defects > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Rectify all C2 (potentially dangerous) electrical defects within 28 days — C2 defects will become dangerous if left unaddressed. Schedule remedial work with a qualified electrician and track progress.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  if (coBatteryLowOrDead > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Immediately replace low or dead batteries in all CO detectors — battery failure renders detectors non-functional. Consider transitioning to sealed-battery or mains-wired detectors for greater reliability.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  if (gasWarningNotices > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Address all outstanding gas warning notices — warning notices indicate serious safety issues requiring documented remedial action. Retain all notices as evidence and ensure remedial work is completed by a Gas Safe registered engineer.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  // Soon recommendations
  if (meets(patTestingRate, 50) && below(patTestingRate, 80) && totalPatRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve PAT testing compliance to at least 80% — schedule a catch-up programme for all overdue appliances and implement calendar reminders to prevent future lapses.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  if (meets(gasCertificateRate, 50) && below(gasCertificateRate, 80) && totalGasRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all gas safety certificates are renewed before expiry — implement a certificate tracking system with advance reminders to maintain 100% compliance.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  if (meets(electricalInspectionRate, 50) && below(electricalInspectionRate, 80) && totalElectricalRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Bring all electrical inspections up to date — implement an inspection schedule with advance planning to ensure inspections are completed before they become overdue.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  if (below(childSafetyRate, 80) && meets(childSafetyRate, 50) && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Extend electrical and gas safety awareness to all children — each child should receive age-appropriate education about electrical and gas hazards and know what to do in an emergency.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Safety and protection",
    });
  }

  if (below(childSafetyRate, 50) && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently implement safety awareness sessions for all children — most children have not received electrical and gas safety education, leaving them unable to protect themselves from hazards.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Safety and protection",
    });
  }

  if (below(emergencyProcedureRate, 70) && totalChildSafetyRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen children's knowledge of emergency procedures — all children must know how to respond to electrical and gas emergencies including how to raise the alarm and evacuate safely.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Safety and protection",
    });
  }

  if (below(rcdOperatingRate, 80) && totalElectricalRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Repair or replace all non-functioning RCDs — residual current devices are an essential safety measure that protects against electric shock. Engage a qualified electrician to restore all RCDs to working order.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  if (below(coPositionedCorrectlyRate, 80) && totalCoDetectors > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Reposition incorrectly placed CO detectors — carbon monoxide detectors must be positioned according to manufacturer guidelines and building regulations to ensure effective detection.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  if (below(gasCoReadingRate, 80) && totalGasRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Investigate gas appliances with unacceptable CO readings — elevated carbon monoxide readings indicate incomplete combustion requiring servicing. Commission a Gas Safe registered engineer to inspect and service affected appliances.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  // Planned recommendations
  if (childSafetyReviewOverdueCount > 0 && totalChildSafetyRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Complete all overdue child safety awareness reviews — children's understanding of safety evolves with age and regular refreshers ensure knowledge remains current.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Safety and protection",
    });
  }

  if (below(staffTrainingRate, 60) && total_staff > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Broaden staff participation in electrical and gas safety education delivery — more staff trained to deliver safety awareness ensures consistent messaging and coverage across all shifts.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  if (coReplacementDueCount > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Plan replacement of CO detectors that are reaching end of life — carbon monoxide detectors have a limited lifespan (typically 5-7 years). Schedule proactive replacement to maintain continuous protection.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  if (below(patLabelRate, 90) && totalPatRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all tested appliances have current PAT labels — visible labels allow staff to quickly verify testing status and identify appliances that should not be used.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  if (totalFiDefects > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Schedule further investigation for all FI-coded electrical observations — FI items require additional testing to determine their significance and whether remedial work is needed.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  if (below(supportProvisionRate, 80) && additionalSupportNeeded > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all children identified as needing additional safety support receive tailored assistance — where support needs are identified, they must be acted upon to close knowledge gaps.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Safety and protection",
    });
  }

  if (below(practicalDemoRate, 70) && totalChildSafetyRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase practical demonstration components in safety awareness sessions — children learn safety skills more effectively through hands-on demonstration rather than theoretical teaching alone.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Safety and protection",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: ElectricityGasSafetyInsight[] = [];

  // -- Critical insights --

  if (gasImmediatelyDangerous > 0) {
    insights.push({
      text: `${gasImmediatelyDangerous} gas appliance${gasImmediatelyDangerous !== 1 ? "s classified" : " classified"} as immediately dangerous. This is the most serious gas safety classification — these appliances present an immediate risk to life from carbon monoxide poisoning, fire, or explosion. Under Gas Safety Regulations, they must be disconnected and not used until a Gas Safe registered engineer confirms they are safe. This represents a critical Reg 25 compliance failure.`,
      severity: "critical",
    });
  }

  if (totalC1Defects > 0) {
    insights.push({
      text: `${totalC1Defects} C1 (danger present) electrical defect${totalC1Defects !== 1 ? "s" : ""} identified in the home's electrical installation. C1 defects indicate immediate danger from electric shock or fire — the defect is live and presents a present danger to anyone in the building. Immediate isolation and remedial work is required. Ofsted will view unresolved C1 defects as a fundamental failure under Reg 25.`,
      severity: "critical",
    });
  }

  if (below(patTestingRate, 50) && totalPatRecords > 0) {
    insights.push({
      text: `Only ${patTestingRate}% of portable appliance testing is current. Untested electrical appliances are an unknown risk — they may have damaged cables, faulty insulation, or missing earth connections that could cause electric shock or fire. In a children's home, where young people may use appliances unsupervised, this gap in testing represents a significant safeguarding concern under Reg 25.`,
      severity: "critical",
    });
  }

  if (below(gasCertificateRate, 50) && totalGasRecords > 0) {
    insights.push({
      text: `Only ${gasCertificateRate}% of gas safety certificates are current. Gas Safety (Installation and Use) Regulations require annual safety checks on all gas appliances. Operating gas appliances without current certificates in a children's home is both illegal and dangerous — it means the home cannot evidence that gas appliances are safe for children to be around.`,
      severity: "critical",
    });
  }

  if (below(electricalInspectionRate, 50) && totalElectricalRecords > 0) {
    insights.push({
      text: `Only ${electricalInspectionRate}% of electrical inspections are current. Electrical Installation Condition Reports (EICRs) verify the ongoing safety of the home's fixed wiring. Without current inspections, hidden deterioration in wiring, distribution boards, and protective devices goes undetected, creating fire and electrocution risks. Ofsted inspectors will request evidence of current EICRs.`,
      severity: "critical",
    });
  }

  if (below(coDetectorRate, 50) && totalCoDetectors > 0) {
    insights.push({
      text: `Only ${coDetectorRate}% of CO detectors have current testing. Carbon monoxide is an invisible, odourless gas that kills — children are particularly vulnerable as they may not recognise symptoms. Without regularly tested, functional CO detectors, the home has no early warning system for CO leaks. This is a life-safety issue that Ofsted considers fundamental under Reg 25.`,
      severity: "critical",
    });
  }

  if (coNotFunctioningCount > 0 && totalCoDetectors > 0) {
    insights.push({
      text: `${coNotFunctioningCount} carbon monoxide detector${coNotFunctioningCount !== 1 ? "s are" : " is"} not functioning. A non-functional CO detector provides zero protection. Carbon monoxide poisoning can be fatal within hours, and children may be less able to recognise symptoms such as headaches, nausea, and drowsiness. Every room with a gas appliance must have a functioning detector.`,
      severity: "critical",
    });
  }

  if (patChildAccessibleFailed > 0) {
    insights.push({
      text: `${patChildAccessibleFailed} appliance${patChildAccessibleFailed !== 1 ? "s" : ""} accessible to children ${patChildAccessibleFailed !== 1 ? "have" : "has"} failed testing or ${patChildAccessibleFailed !== 1 ? "have" : "has"} defects. Children may interact with electrical appliances without fully understanding the risks. A failed or defective appliance in a child-accessible area represents a direct, foreseeable risk of harm that Ofsted will consider a serious safeguarding failure.`,
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (meets(patTestingRate, 50) && below(patTestingRate, 80) && totalPatRecords > 0) {
    insights.push({
      text: `PAT testing compliance at ${patTestingRate}% — improving but some appliances remain untested. Each untested appliance is an unquantified risk. Consider implementing a rolling testing programme to prevent backlogs and ensure continuous compliance.`,
      severity: "warning",
    });
  }

  if (meets(gasCertificateRate, 50) && below(gasCertificateRate, 80) && totalGasRecords > 0) {
    insights.push({
      text: `Gas certificate compliance at ${gasCertificateRate}% — some certificates have expired or are due. Gas safety checks must be renewed annually, and the home should plan renewals at least one month before expiry to allow for scheduling and any remedial work.`,
      severity: "warning",
    });
  }

  if (meets(electricalInspectionRate, 50) && below(electricalInspectionRate, 80) && totalElectricalRecords > 0) {
    insights.push({
      text: `Electrical inspection compliance at ${electricalInspectionRate}% — some inspections are overdue. EICRs for rented residential premises (including children's homes) are typically required every 5 years. Plan inspections well in advance to allow time for any remedial work.`,
      severity: "warning",
    });
  }

  if (meets(coDetectorRate, 50) && below(coDetectorRate, 80) && totalCoDetectors > 0) {
    insights.push({
      text: `CO detector testing at ${coDetectorRate}% — some detectors have overdue testing. Monthly functional testing of CO detectors is recommended as a minimum. Consider implementing a structured testing schedule linked to fire safety checks.`,
      severity: "warning",
    });
  }

  if (totalC2Defects > 0 && totalC1Defects === 0) {
    insights.push({
      text: `${totalC2Defects} C2 (potentially dangerous) electrical defect${totalC2Defects !== 1 ? "s" : ""} require attention. While not an immediate danger, C2 defects will become dangerous if left unresolved. Best practice is to rectify C2 defects within 28 days of identification to prevent escalation.`,
      severity: "warning",
    });
  }

  if (totalC3Defects > 0 && totalC1Defects === 0 && totalC2Defects === 0) {
    insights.push({
      text: `${totalC3Defects} C3 (improvement recommended) observation${totalC3Defects !== 1 ? "s" : ""} noted. C3 items are not defects requiring mandatory remediation, but addressing them improves the overall safety standard of the electrical installation and demonstrates proactive maintenance.`,
      severity: "warning",
    });
  }

  if (gasAtRisk > 0 && gasImmediatelyDangerous === 0) {
    insights.push({
      text: `${gasAtRisk} gas appliance${gasAtRisk !== 1 ? "s" : ""} classified as at risk. At-risk appliances are not immediately dangerous but have identified safety concerns. Without remedial action, at-risk appliances may deteriorate to immediately dangerous status, particularly with continued use.`,
      severity: "warning",
    });
  }

  if (meets(childSafetyRate, 50) && below(childSafetyRate, 80) && total_children > 0) {
    insights.push({
      text: `Child safety awareness coverage at ${childSafetyRate}% — some children still lack formal safety education. All children should receive age-appropriate information about electrical and gas hazards, including how to recognise danger signs and what to do in an emergency.`,
      severity: "warning",
    });
  }

  if (below(childSafetyRate, 50) && total_children > 0) {
    insights.push({
      text: `Only ${childSafetyRate}% of children have received safety awareness assessment. Children in residential care may have limited prior exposure to safety education. Without targeted, age-appropriate education, they may not recognise electrical or gas hazards, understand the significance of CO alarm sounds, or know how to respond in an emergency.`,
      severity: "warning",
    });
  }

  if ((avgKnowledgeScore ?? 0) >= 4.0 && (avgKnowledgeScore ?? 0) < 6.0 && totalChildSafetyRecords > 0) {
    insights.push({
      text: `Average child safety knowledge score ${avgKnowledgeScore}/10 — children's understanding of electrical and gas safety could be strengthened. Consider using practical demonstrations, visual aids, and scenario-based learning to improve engagement and retention.`,
      severity: "warning",
    });
  }

  if (below(staffTrainingRate, 60) && total_staff > 0) {
    insights.push({
      text: `Only ${staffTrainingRate}% of staff have been involved in delivering safety awareness. Limited staff involvement may indicate gaps in staff confidence or competency in electrical and gas safety. All staff should be trained to recognise and respond to electrical and gas safety hazards.`,
      severity: "warning",
    });
  }

  if (meets(defectResolutionRate, 50) && below(defectResolutionRate, 80) && totalDefectsAll > 0) {
    insights.push({
      text: `Overall defect resolution at ${defectResolutionRate}% — some identified safety defects remain unresolved. Every unresolved defect is a known risk that the home has identified but not yet addressed. Implement a defect tracker with assigned owners and target resolution dates.`,
      severity: "warning",
    });
  }

  if (coReplacementDueCount > 0 && coNotFunctioningCount === 0) {
    insights.push({
      text: `${coReplacementDueCount} CO detector${coReplacementDueCount !== 1 ? "s are" : " is"} approaching end of life. CO detectors typically have a 5-7 year lifespan after which their sensors degrade. Plan proactive replacement before detectors reach expiry to maintain continuous protection.`,
      severity: "warning",
    });
  }

  // Analysis of PAT appliance categories
  const applianceCategoryCounts: Record<string, number> = {};
  for (const pat of pat_testing_records) {
    applianceCategoryCounts[pat.appliance_category] =
      (applianceCategoryCounts[pat.appliance_category] ?? 0) + 1;
  }
  const topApplianceCategories = Object.entries(applianceCategoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topApplianceCategories.length > 0 && totalPatRecords >= 5) {
    const catStr = topApplianceCategories
      .map(([t, c]) => `${t.replace(/_/g, " ")} (${c})`)
      .join(", ");
    insights.push({
      text: `PAT tested appliance categories: ${catStr}. Ensure the testing programme covers all appliance categories including IT equipment, portable heaters, and child-accessible devices — each category has different risk profiles and testing frequencies.`,
      severity: "warning",
    });
  }

  // Analysis of gas certificate types
  const gasCertTypeCounts: Record<string, number> = {};
  for (const gc of gas_certificate_records) {
    gasCertTypeCounts[gc.certificate_type] =
      (gasCertTypeCounts[gc.certificate_type] ?? 0) + 1;
  }
  const topGasCertTypes = Object.entries(gasCertTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topGasCertTypes.length > 0 && totalGasRecords >= 3) {
    const gcStr = topGasCertTypes
      .map(([t, c]) => `${t.replace(/_/g, " ")} (${c})`)
      .join(", ");
    insights.push({
      text: `Gas safety certificate types: ${gcStr}. The annual CP12 landlord safety certificate is the primary legal requirement — ensure it covers all gas appliances, flues, and pipework within the home.`,
      severity: "warning",
    });
  }

  // Analysis of electrical inspection types
  const electricalInspTypeCounts: Record<string, number> = {};
  for (const ei of electrical_inspection_records) {
    electricalInspTypeCounts[ei.inspection_type] =
      (electricalInspTypeCounts[ei.inspection_type] ?? 0) + 1;
  }
  const topElectricalInspTypes = Object.entries(electricalInspTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topElectricalInspTypes.length > 0 && totalElectricalRecords >= 3) {
    const eiStr = topElectricalInspTypes
      .map(([t, c]) => `${t.replace(/_/g, " ")} (${c})`)
      .join(", ");
    insights.push({
      text: `Electrical inspection types: ${eiStr}. A comprehensive electrical safety programme includes EICRs for fixed wiring, emergency lighting testing, fire alarm testing, and RCD checks — ensure all elements are covered.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (electrical_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding electrical and gas safety compliance — PAT testing is current, gas certificates are valid, electrical inspections are up to date, CO detectors are functioning, and children understand safety risks. This comprehensive approach evidences exemplary premises safety under Reg 25 and is strong evidence for Ofsted.",
      severity: "positive",
    });
  }

  if (meets(patTestingRate, 100) && meets(patPassRate, 100) && totalPatRecords > 0) {
    insights.push({
      text: "All portable appliance testing is current with a 100% pass rate — the home operates a comprehensive and effective PAT testing programme. Every portable electrical appliance has been verified as safe, providing strong evidence of proactive electrical safety management.",
      severity: "positive",
    });
  }

  if (meets(gasCertificateRate, 100) && meets(gasSatisfactoryRate, 100) && totalGasRecords > 0) {
    insights.push({
      text: "All gas safety certificates are current with every appliance rated satisfactory — the home maintains exemplary gas safety compliance. This provides robust evidence that all gas installations and appliances are safe for children and staff.",
      severity: "positive",
    });
  }

  if (meets(electricalInspectionRate, 100) && meets(electricalSatisfactoryRate, 100) && totalElectricalRecords > 0) {
    insights.push({
      text: "All electrical inspections are current and satisfactory — the home's fixed electrical installations fully meet current safety standards. This is strong evidence of well-maintained premises under Reg 25.",
      severity: "positive",
    });
  }

  if (meets(coDetectorRate, 100) && meets(coFunctioningRate, 100) && totalCoDetectors > 0) {
    insights.push({
      text: "All carbon monoxide detectors are tested, functioning, and current — the home provides comprehensive CO protection for all children and staff. This demonstrates proactive life-safety management.",
      severity: "positive",
    });
  }

  if (
    meets(childSafetyRate, 100) &&
    meets(emergencyProcedureRate, 100) &&
    total_children > 0 &&
    totalChildSafetyRecords > 0
  ) {
    insights.push({
      text: "Every child has received safety awareness assessment and all know emergency procedures — the home ensures children are equipped to recognise and respond to electrical and gas safety hazards. This child-centred approach to safety education strengthens the overall safeguarding framework.",
      severity: "positive",
    });
  }

  if (meets(defectResolutionRate, 100) && totalDefectsAll > 0) {
    insights.push({
      text: "Every identified safety defect has been resolved across all domains — the home demonstrates a zero-tolerance approach to electrical and gas safety defects. No known safety issues remain outstanding, providing strong evidence of responsive and thorough safety management.",
      severity: "positive",
    });
  }

  if (
    meets(staffTrainingRate, 80) &&
    meets(childSafetyRate, 80) &&
    total_staff > 0 &&
    total_children > 0
  ) {
    insights.push({
      text: `${staffTrainingRate}% staff involvement in safety education with ${childSafetyRate}% child coverage — the home has built a strong culture of safety awareness where staff are confident and competent in delivering safety education to children.`,
      severity: "positive",
    });
  }

  if (
    meets(rcdTestedRate, 100) &&
    meets(rcdOperatingRate, 100) &&
    meets(earthingRate, 100) &&
    meets(bondingRate, 100) &&
    totalElectricalRecords > 0
  ) {
    insights.push({
      text: "All RCDs tested and operating correctly with satisfactory earthing and bonding throughout — the home's electrical safety infrastructure provides multiple layers of protection against electric shock, demonstrating best-practice electrical safety management.",
      severity: "positive",
    });
  }

  if (
    meets(gasFlueCheckedRate, 100) &&
    meets(gasVentilationRate, 100) &&
    meets(gasSafetyDeviceRate, 100) &&
    meets(gasCoReadingRate, 100) &&
    totalGasRecords > 0
  ) {
    insights.push({
      text: "All gas appliance flues checked, ventilation adequate, safety devices operational, and CO readings acceptable — every element of gas safety has been verified, providing comprehensive protection against carbon monoxide and gas-related hazards.",
      severity: "positive",
    });
  }

  if (
    meets(coPositionedCorrectlyRate, 100) &&
    meets(coNearGasRate, 80) &&
    meets(coNearSleepingRate, 80) &&
    meets(coAudibleRate, 80) &&
    totalCoDetectors > 0
  ) {
    insights.push({
      text: "CO detectors are correctly positioned near gas appliances and sleeping areas with good audibility from bedrooms — the placement strategy ensures maximum detection effectiveness and early warning for children, particularly during sleep when CO poisoning is most dangerous.",
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (electrical_rating === "outstanding") {
    headline =
      "Outstanding electricity and gas safety — PAT testing, gas certificates, electrical inspections, CO detectors, and child safety awareness are all at exemplary levels.";
  } else if (electrical_rating === "good") {
    headline = `Good electricity and gas safety compliance — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (electrical_rating === "adequate") {
    headline = `Adequate electricity and gas safety — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure full premises safety compliance.`;
  } else {
    headline = `Electricity and gas safety is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to protect children from electrical and gas hazards.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    electrical_rating,
    electrical_score: score,
    headline,
    total_appliances_tested: totalPatRecords,
    pat_testing_rate: patTestingRate,
    gas_certificate_rate: gasCertificateRate,
    electrical_inspection_rate: electricalInspectionRate,
    co_detector_rate: coDetectorRate,
    child_safety_rate: childSafetyRate,
    staff_training_rate: staffTrainingRate,
    pat_pass_rate: patPassRate,
    gas_satisfactory_rate: gasSatisfactoryRate,
    electrical_satisfactory_rate: electricalSatisfactoryRate,
    co_functioning_rate: coFunctioningRate,
    defect_resolution_rate: defectResolutionRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
