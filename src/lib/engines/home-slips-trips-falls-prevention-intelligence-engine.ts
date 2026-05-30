// ==============================================================================
// CORNERSTONE -- HOME SLIPS, TRIPS & FALLS PREVENTION INTELLIGENCE ENGINE
// Measures slip/trip risk assessments, flooring condition audits, wet floor
// protocol compliance, stairway safety checks, and incident tracking/learning.
// Pure deterministic engine -- no imports, no LLM, no external deps.
// Ofsted CHR 2015 Reg 25 (Premises), Reg 5 (Engaging, helping, protecting),
// SCCIF "Safety of children".
// Store keys: slipTripRiskAssessmentRecords, flooringConditionRecords,
//             wetFloorProtocolRecords, stairwaySafetyRecords,
//             slipTripFallIncidentRecords
// ==============================================================================

// -- Input Types --------------------------------------------------------------

export interface SlipTripRiskAssessmentRecordInput {
  id: string;
  area_name: string;
  assessment_date: string;
  assessor_name: string;
  risk_level: "low" | "medium" | "high" | "critical";
  hazards_identified: string[];
  controls_in_place: boolean;
  controls_adequate: boolean;
  review_date: string | null;
  review_overdue: boolean;
  actions_required: number;
  actions_completed: number;
  children_consulted: boolean;
  environment_type: "indoor" | "outdoor" | "both";
  weather_considerations_documented: boolean;
  signed_off: boolean;
  created_at: string;
}

export interface FlooringConditionRecordInput {
  id: string;
  area_name: string;
  flooring_type: "carpet" | "vinyl" | "tile" | "laminate" | "wood" | "concrete" | "rubber" | "other";
  inspection_date: string;
  condition: "good" | "fair" | "poor" | "hazardous";
  issues_found: string[];
  slip_resistance_adequate: boolean;
  trip_hazards_present: boolean;
  repair_needed: boolean;
  repair_completed: boolean;
  repair_date: string | null;
  mat_secured: boolean;
  threshold_safe: boolean;
  inspector_name: string;
  next_inspection_due: string | null;
  created_at: string;
}

export interface WetFloorProtocolRecordInput {
  id: string;
  area_name: string;
  date: string;
  signage_deployed: boolean;
  signage_timely: boolean;
  cleaning_schedule_followed: boolean;
  spill_response_within_target: boolean;
  response_time_minutes: number;
  barrier_used: boolean;
  staff_trained: boolean;
  children_warned: boolean;
  protocol_documented: boolean;
  incident_resulted: boolean;
  weather_related: boolean;
  entrance_matting_adequate: boolean;
  created_at: string;
}

export interface StairwaySafetyRecordInput {
  id: string;
  stairway_location: string;
  inspection_date: string;
  handrail_secure: boolean;
  handrail_both_sides: boolean;
  treads_non_slip: boolean;
  nosings_visible: boolean;
  lighting_adequate: boolean;
  clutter_free: boolean;
  gate_fitted: boolean;
  gate_functional: boolean;
  carpet_secure: boolean;
  width_adequate: boolean;
  defects_found: string[];
  defects_rectified: boolean;
  rectification_date: string | null;
  inspector_name: string;
  child_specific_risks_assessed: boolean;
  created_at: string;
}

export interface SlipTripFallIncidentRecordInput {
  id: string;
  child_id: string;
  date: string;
  location: string;
  incident_type: "slip" | "trip" | "fall" | "near_miss";
  severity: "minor" | "moderate" | "serious" | "major";
  cause: string;
  surface_condition: "dry" | "wet" | "icy" | "uneven" | "cluttered" | "other";
  footwear_appropriate: boolean;
  lighting_adequate: boolean;
  injury_sustained: boolean;
  injury_description: string;
  first_aid_given: boolean;
  medical_attention_required: boolean;
  parent_carer_notified: boolean;
  social_worker_notified: boolean;
  investigation_completed: boolean;
  root_cause_identified: boolean;
  corrective_actions_taken: string[];
  lessons_learned_documented: boolean;
  lessons_shared_with_staff: boolean;
  risk_assessment_updated: boolean;
  recurrence: boolean;
  created_at: string;
}

export interface SlipsTripsFallsPreventionInput {
  today: string;
  total_children: number;
  risk_assessment_records: SlipTripRiskAssessmentRecordInput[];
  flooring_condition_records: FlooringConditionRecordInput[];
  wet_floor_records: WetFloorProtocolRecordInput[];
  stairway_safety_records: StairwaySafetyRecordInput[];
  incident_records: SlipTripFallIncidentRecordInput[];
}

// -- Output Types -------------------------------------------------------------

export type SlipsTripsFallsRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface SlipsTripsFallsInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface SlipsTripsFallsRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface SlipsTripsFallsPreventionResult {
  falls_prevention_rating: SlipsTripsFallsRating;
  falls_prevention_score: number;
  headline: string;
  risk_assessment_rate: number;
  flooring_condition_rate: number;
  wet_floor_protocol_rate: number;
  stairway_safety_rate: number;
  incident_learning_rate: number;
  staff_awareness_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: SlipsTripsFallsRecommendation[];
  insights: SlipsTripsFallsInsight[];
}

// -- Helpers ------------------------------------------------------------------

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function daysBetween(a: string, b: string): number {
  const msA = new Date(a).getTime();
  const msB = new Date(b).getTime();
  if (isNaN(msA) || isNaN(msB)) return 9999;
  return Math.floor(Math.abs(msB - msA) / 86_400_000);
}

function toRating(score: number): SlipsTripsFallsRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// -- Empty Result Factory -----------------------------------------------------

function emptyResult(
  rating: SlipsTripsFallsRating,
  score: number,
  headline: string,
): SlipsTripsFallsPreventionResult {
  return {
    falls_prevention_rating: rating,
    falls_prevention_score: score,
    headline,
    risk_assessment_rate: 0,
    flooring_condition_rate: 0,
    wet_floor_protocol_rate: 0,
    stairway_safety_rate: 0,
    incident_learning_rate: 0,
    staff_awareness_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// -- Main Compute -------------------------------------------------------------

export function computeSlipsTripsFallsPrevention(
  input: SlipsTripsFallsPreventionInput,
): SlipsTripsFallsPreventionResult {
  const {
    today,
    total_children,
    risk_assessment_records,
    flooring_condition_records,
    wet_floor_records,
    stairway_safety_records,
    incident_records,
  } = input;

  // -- Special case: all empty + 0 children -> insufficient_data ------------
  const allEmpty =
    risk_assessment_records.length === 0 &&
    flooring_condition_records.length === 0 &&
    wet_floor_records.length === 0 &&
    stairway_safety_records.length === 0 &&
    incident_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement -- insufficient data to assess slips, trips and falls prevention.",
    );
  }

  // -- Special case: all empty + children > 0 -> inadequate -----------------
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No slips, trips and falls prevention data recorded despite children on placement -- risk assessments, flooring audits, wet floor protocols, stairway safety checks, and incident tracking require urgent implementation.",
      ),
      concerns: [
        "No slip/trip risk assessments, flooring condition audits, wet floor protocol records, stairway safety checks, or incident records exist despite children being on placement -- the home cannot evidence that premises are safe from slip, trip, and fall hazards.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement comprehensive slip, trip and fall risk assessments for all areas of the home and grounds. Document hazards, controls, and review dates to evidence compliance with premises safety requirements.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 25 -- Premises",
        },
        {
          rank: 2,
          recommendation:
            "Establish flooring condition audit schedules, wet floor response protocols, and stairway safety inspection routines. Record all findings and corrective actions to demonstrate ongoing premises safety management.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 5 -- Engaging, helping, protecting",
        },
      ],
      insights: [
        {
          text: "The complete absence of slips, trips and falls prevention records means the home cannot demonstrate to Ofsted that premises are maintained to protect children from foreseeable hazards. This represents a fundamental gap in Reg 25 compliance and the duty to ensure children's safety.",
          severity: "critical",
        },
      ],
    };
  }

  // -- Compute core metrics -------------------------------------------------

  // --- Risk assessment compliance ---
  const totalRiskAssessments = risk_assessment_records.length;
  const controlsAdequate = risk_assessment_records.filter((r) => r.controls_in_place && r.controls_adequate).length;
  const riskAssessmentRate = pct(controlsAdequate, totalRiskAssessments);

  const signedOff = risk_assessment_records.filter((r) => r.signed_off).length;
  const signedOffRate = pct(signedOff, totalRiskAssessments);

  const reviewOverdue = risk_assessment_records.filter((r) => r.review_overdue).length;
  const reviewOverdueRate = pct(reviewOverdue, totalRiskAssessments);

  const totalRiskActions = risk_assessment_records.reduce((sum, r) => sum + r.actions_required, 0);
  const completedRiskActions = risk_assessment_records.reduce((sum, r) => sum + r.actions_completed, 0);
  const riskActionCompletionRate = pct(completedRiskActions, totalRiskActions);

  const highCriticalRisks = risk_assessment_records.filter(
    (r) => r.risk_level === "high" || r.risk_level === "critical",
  ).length;
  const highCriticalRate = pct(highCriticalRisks, totalRiskAssessments);

  const childrenConsulted = risk_assessment_records.filter((r) => r.children_consulted).length;
  const childrenConsultedRate = pct(childrenConsulted, totalRiskAssessments);

  const weatherDocumented = risk_assessment_records.filter((r) => r.weather_considerations_documented).length;
  const weatherDocRate = pct(weatherDocumented, totalRiskAssessments);

  const outdoorAssessments = risk_assessment_records.filter(
    (r) => r.environment_type === "outdoor" || r.environment_type === "both",
  ).length;

  // --- Flooring condition ---
  const totalFlooringRecords = flooring_condition_records.length;
  const flooringGoodFair = flooring_condition_records.filter(
    (r) => r.condition === "good" || r.condition === "fair",
  ).length;
  const flooringConditionRate = pct(flooringGoodFair, totalFlooringRecords);

  const slipResistanceAdequate = flooring_condition_records.filter((r) => r.slip_resistance_adequate).length;
  const slipResistanceRate = pct(slipResistanceAdequate, totalFlooringRecords);

  const tripHazardsPresent = flooring_condition_records.filter((r) => r.trip_hazards_present).length;
  const tripHazardRate = pct(tripHazardsPresent, totalFlooringRecords);

  const hazardousFlooring = flooring_condition_records.filter((r) => r.condition === "hazardous").length;
  const hazardousFlooringRate = pct(hazardousFlooring, totalFlooringRecords);

  const repairsNeeded = flooring_condition_records.filter((r) => r.repair_needed).length;
  const repairsCompleted = flooring_condition_records.filter((r) => r.repair_needed && r.repair_completed).length;
  const repairCompletionRate = pct(repairsCompleted, repairsNeeded);

  const matsSecured = flooring_condition_records.filter((r) => r.mat_secured).length;
  const matSecuredRate = pct(matsSecured, totalFlooringRecords);

  const thresholdsSafe = flooring_condition_records.filter((r) => r.threshold_safe).length;
  const thresholdSafeRate = pct(thresholdsSafe, totalFlooringRecords);

  // --- Wet floor protocol compliance ---
  const totalWetFloorRecords = wet_floor_records.length;
  const signageDeployed = wet_floor_records.filter((r) => r.signage_deployed && r.signage_timely).length;
  const signageRate = pct(signageDeployed, totalWetFloorRecords);

  const cleaningFollowed = wet_floor_records.filter((r) => r.cleaning_schedule_followed).length;
  const cleaningRate = pct(cleaningFollowed, totalWetFloorRecords);

  const spillResponseOnTarget = wet_floor_records.filter((r) => r.spill_response_within_target).length;
  const spillResponseRate = pct(spillResponseOnTarget, totalWetFloorRecords);

  const wetFloorStaffTrained = wet_floor_records.filter((r) => r.staff_trained).length;
  const wetFloorTrainedRate = pct(wetFloorStaffTrained, totalWetFloorRecords);

  const protocolDocumented = wet_floor_records.filter((r) => r.protocol_documented).length;
  const protocolDocRate = pct(protocolDocumented, totalWetFloorRecords);

  const entranceMattingAdequate = wet_floor_records.filter((r) => r.entrance_matting_adequate).length;
  const entranceMattingRate = pct(entranceMattingAdequate, totalWetFloorRecords);

  const incidentsFromWetFloor = wet_floor_records.filter((r) => r.incident_resulted).length;
  const wetFloorIncidentRate = pct(incidentsFromWetFloor, totalWetFloorRecords);

  const childrenWarned = wet_floor_records.filter((r) => r.children_warned).length;
  const childrenWarnedRate = pct(childrenWarned, totalWetFloorRecords);

  const wetFloorProtocolRate =
    totalWetFloorRecords > 0
      ? Math.round((signageRate + cleaningRate + spillResponseRate + protocolDocRate) / 4)
      : 0;

  // --- Stairway safety ---
  const totalStairwayRecords = stairway_safety_records.length;
  const handrailSecure = stairway_safety_records.filter((r) => r.handrail_secure).length;
  const handrailRate = pct(handrailSecure, totalStairwayRecords);

  const handrailBothSides = stairway_safety_records.filter((r) => r.handrail_both_sides).length;
  const handrailBothRate = pct(handrailBothSides, totalStairwayRecords);

  const treadsNonSlip = stairway_safety_records.filter((r) => r.treads_non_slip).length;
  const treadsRate = pct(treadsNonSlip, totalStairwayRecords);

  const nosingsVisible = stairway_safety_records.filter((r) => r.nosings_visible).length;
  const nosingsRate = pct(nosingsVisible, totalStairwayRecords);

  const stairLightingAdequate = stairway_safety_records.filter((r) => r.lighting_adequate).length;
  const stairLightingRate = pct(stairLightingAdequate, totalStairwayRecords);

  const clutterFree = stairway_safety_records.filter((r) => r.clutter_free).length;
  const clutterFreeRate = pct(clutterFree, totalStairwayRecords);

  const carpetSecure = stairway_safety_records.filter((r) => r.carpet_secure).length;
  const carpetSecureRate = pct(carpetSecure, totalStairwayRecords);

  const stairDefectsFound = stairway_safety_records.filter((r) => r.defects_found.length > 0).length;
  const stairDefectsRectified = stairway_safety_records.filter(
    (r) => r.defects_found.length > 0 && r.defects_rectified,
  ).length;
  const stairDefectRectificationRate = pct(stairDefectsRectified, stairDefectsFound);

  const childSpecificRisksAssessed = stairway_safety_records.filter((r) => r.child_specific_risks_assessed).length;
  const childSpecificRate = pct(childSpecificRisksAssessed, totalStairwayRecords);

  const stairwaySafetyRate =
    totalStairwayRecords > 0
      ? Math.round((handrailRate + treadsRate + stairLightingRate + clutterFreeRate + carpetSecureRate) / 5)
      : 0;

  // --- Incident tracking and learning ---
  const totalIncidents = incident_records.length;
  const investigationsCompleted = incident_records.filter((r) => r.investigation_completed).length;
  const investigationRate = pct(investigationsCompleted, totalIncidents);

  const rootCauseIdentified = incident_records.filter((r) => r.root_cause_identified).length;
  const rootCauseRate = pct(rootCauseIdentified, totalIncidents);

  const lessonsDocumented = incident_records.filter((r) => r.lessons_learned_documented).length;
  const lessonsDocRate = pct(lessonsDocumented, totalIncidents);

  const lessonsShared = incident_records.filter((r) => r.lessons_shared_with_staff).length;
  const lessonsSharedRate = pct(lessonsShared, totalIncidents);

  const riskAssessmentUpdated = incident_records.filter((r) => r.risk_assessment_updated).length;
  const riskAssessmentUpdatedRate = pct(riskAssessmentUpdated, totalIncidents);

  const incidentLearningRate =
    totalIncidents > 0
      ? Math.round((investigationRate + rootCauseRate + lessonsDocRate + lessonsSharedRate + riskAssessmentUpdatedRate) / 5)
      : 0;

  const seriousMajorIncidents = incident_records.filter(
    (r) => r.severity === "serious" || r.severity === "major",
  ).length;
  const seriousMajorRate = pct(seriousMajorIncidents, totalIncidents);

  const nearMisses = incident_records.filter((r) => r.incident_type === "near_miss").length;
  const nearMissRate = pct(nearMisses, totalIncidents);

  const recurrences = incident_records.filter((r) => r.recurrence).length;
  const recurrenceRate = pct(recurrences, totalIncidents);

  const injuriesSustained = incident_records.filter((r) => r.injury_sustained).length;
  const injuryRate = pct(injuriesSustained, totalIncidents);

  const medicalRequired = incident_records.filter((r) => r.medical_attention_required).length;
  const medicalRate = pct(medicalRequired, totalIncidents);

  const parentNotified = incident_records.filter((r) => r.parent_carer_notified).length;
  const parentNotificationRate = pct(parentNotified, totalIncidents);

  const socialWorkerNotified = incident_records.filter((r) => r.social_worker_notified).length;
  const socialWorkerNotificationRate = pct(socialWorkerNotified, totalIncidents);

  const firstAidGiven = incident_records.filter((r) => r.injury_sustained && r.first_aid_given).length;
  const firstAidRate = pct(firstAidGiven, injuriesSustained);

  const footwearAppropriate = incident_records.filter((r) => r.footwear_appropriate).length;
  const footwearRate = pct(footwearAppropriate, totalIncidents);

  const lightingAdequateIncidents = incident_records.filter((r) => r.lighting_adequate).length;
  const lightingAdequateRate = pct(lightingAdequateIncidents, totalIncidents);

  // --- Staff awareness composite ---
  const staffAwarenessNumerators: number[] = [];
  if (totalWetFloorRecords > 0) staffAwarenessNumerators.push(wetFloorTrainedRate);
  if (totalRiskAssessments > 0) staffAwarenessNumerators.push(signedOffRate);
  if (totalIncidents > 0) staffAwarenessNumerators.push(lessonsSharedRate);
  if (totalWetFloorRecords > 0) staffAwarenessNumerators.push(childrenWarnedRate);
  const staffAwarenessRate =
    staffAwarenessNumerators.length > 0
      ? Math.round(staffAwarenessNumerators.reduce((a, b) => a + b, 0) / staffAwarenessNumerators.length)
      : 0;

  // -- Scoring: base 52 ----------------------------------------------------

  let score = 52;

  // --- Bonus 1: riskAssessmentRate (>=90: +5, >=70: +3) ---
  if (riskAssessmentRate >= 90) score += 5;
  else if (riskAssessmentRate >= 70) score += 3;

  // --- Bonus 2: flooringConditionRate (>=90: +5, >=70: +3) ---
  if (flooringConditionRate >= 90) score += 5;
  else if (flooringConditionRate >= 70) score += 3;

  // --- Bonus 3: wetFloorProtocolRate (>=90: +5, >=70: +2) ---
  if (wetFloorProtocolRate >= 90) score += 5;
  else if (wetFloorProtocolRate >= 70) score += 2;

  // --- Bonus 4: stairwaySafetyRate (>=90: +5, >=70: +2) ---
  if (stairwaySafetyRate >= 90) score += 5;
  else if (stairwaySafetyRate >= 70) score += 2;

  // --- Bonus 5: incidentLearningRate (>=90: +4, >=70: +2) ---
  if (incidentLearningRate >= 90) score += 4;
  else if (incidentLearningRate >= 70) score += 2;

  // --- Bonus 6: staffAwarenessRate (>=90: +4, >=70: +2) ---
  if (staffAwarenessRate >= 90) score += 4;
  else if (staffAwarenessRate >= 70) score += 2;

  // -- Penalties (4 with guards) -------------------------------------------

  // riskAssessmentRate < 50 -> -6
  if (riskAssessmentRate < 50 && totalRiskAssessments > 0) score -= 6;

  // hazardousFlooringRate >= 20 -> -6
  if (hazardousFlooringRate >= 20 && totalFlooringRecords > 0) score -= 6;

  // seriousMajorRate >= 30 -> -5
  if (seriousMajorRate >= 30 && totalIncidents > 0) score -= 5;

  // recurrenceRate >= 25 -> -5
  if (recurrenceRate >= 25 && totalIncidents > 0) score -= 5;

  score = clamp(score, 0, 100);

  const falls_prevention_rating = toRating(score);

  // -- Strengths ------------------------------------------------------------

  const strengths: string[] = [];

  if (riskAssessmentRate >= 90 && totalRiskAssessments > 0) {
    strengths.push(
      `${riskAssessmentRate}% of slip/trip risk assessments have adequate controls in place -- the home demonstrates robust hazard identification and control across all assessed areas.`,
    );
  } else if (riskAssessmentRate >= 70 && totalRiskAssessments > 0) {
    strengths.push(
      `${riskAssessmentRate}% of risk assessments demonstrate adequate controls -- good risk management practice with most hazards controlled.`,
    );
  }

  if (riskActionCompletionRate >= 90 && totalRiskActions > 0) {
    strengths.push(
      `${riskActionCompletionRate}% of risk assessment actions completed -- the home acts promptly on identified hazards and follows through on corrective measures.`,
    );
  } else if (riskActionCompletionRate >= 70 && totalRiskActions > 0) {
    strengths.push(
      `${riskActionCompletionRate}% of risk assessment actions completed -- good follow-through on identified hazard controls.`,
    );
  }

  if (signedOffRate >= 90 && totalRiskAssessments > 0) {
    strengths.push(
      `${signedOffRate}% of risk assessments signed off -- strong management oversight of premises safety.`,
    );
  }

  if (childrenConsultedRate >= 80 && totalRiskAssessments > 0) {
    strengths.push(
      `Children consulted in ${childrenConsultedRate}% of risk assessments -- children's views actively shape premises safety decisions.`,
    );
  }

  if (flooringConditionRate >= 90 && totalFlooringRecords > 0) {
    strengths.push(
      `${flooringConditionRate}% of flooring areas in good or fair condition -- the home maintains floor surfaces to a high standard, minimising slip and trip risks.`,
    );
  } else if (flooringConditionRate >= 70 && totalFlooringRecords > 0) {
    strengths.push(
      `${flooringConditionRate}% of flooring areas in acceptable condition -- most floor surfaces are well maintained.`,
    );
  }

  if (slipResistanceRate >= 90 && totalFlooringRecords > 0) {
    strengths.push(
      `Slip resistance adequate in ${slipResistanceRate}% of flooring areas -- the home ensures floor surfaces provide appropriate traction.`,
    );
  }

  if (repairCompletionRate >= 90 && repairsNeeded > 0) {
    strengths.push(
      `${repairCompletionRate}% of flooring repairs completed -- the home responds promptly when floor defects are identified.`,
    );
  }

  if (thresholdSafeRate >= 90 && totalFlooringRecords > 0) {
    strengths.push(
      `${thresholdSafeRate}% of thresholds assessed as safe -- doorway transitions managed effectively to prevent trips.`,
    );
  }

  if (wetFloorProtocolRate >= 90 && totalWetFloorRecords > 0) {
    strengths.push(
      `Wet floor protocol compliance at ${wetFloorProtocolRate}% -- signage, cleaning schedules, spill response, and documentation are consistently followed.`,
    );
  } else if (wetFloorProtocolRate >= 70 && totalWetFloorRecords > 0) {
    strengths.push(
      `Wet floor protocol compliance at ${wetFloorProtocolRate}% -- good adherence to wet floor management procedures.`,
    );
  }

  if (spillResponseRate >= 90 && totalWetFloorRecords > 0) {
    strengths.push(
      `${spillResponseRate}% of spill responses within target time -- the home reacts swiftly to wet floor hazards.`,
    );
  }

  if (entranceMattingRate >= 90 && totalWetFloorRecords > 0) {
    strengths.push(
      `Entrance matting adequate in ${entranceMattingRate}% of assessments -- effective first-line defence against wet floor ingress.`,
    );
  }

  if (stairwaySafetyRate >= 90 && totalStairwayRecords > 0) {
    strengths.push(
      `Stairway safety compliance at ${stairwaySafetyRate}% -- handrails, treads, lighting, clutter management, and carpet security all meet standards.`,
    );
  } else if (stairwaySafetyRate >= 70 && totalStairwayRecords > 0) {
    strengths.push(
      `Stairway safety compliance at ${stairwaySafetyRate}% -- most stairway safety elements meet required standards.`,
    );
  }

  if (handrailRate >= 95 && totalStairwayRecords > 0) {
    strengths.push(
      `Handrails secure in ${handrailRate}% of stairways -- robust physical safeguarding on all staircases.`,
    );
  }

  if (stairDefectRectificationRate >= 90 && stairDefectsFound > 0) {
    strengths.push(
      `${stairDefectRectificationRate}% of stairway defects rectified -- prompt remediation of identified hazards.`,
    );
  }

  if (childSpecificRate >= 80 && totalStairwayRecords > 0) {
    strengths.push(
      `Child-specific stairway risks assessed in ${childSpecificRate}% of inspections -- individual children's needs and vulnerabilities considered in stairway safety.`,
    );
  }

  if (incidentLearningRate >= 90 && totalIncidents > 0) {
    strengths.push(
      `Incident learning rate at ${incidentLearningRate}% -- investigations, root cause analysis, lessons learned, staff sharing, and risk assessment updates are consistently applied after each incident.`,
    );
  } else if (incidentLearningRate >= 70 && totalIncidents > 0) {
    strengths.push(
      `Incident learning rate at ${incidentLearningRate}% -- good evidence of organisational learning from slip, trip, and fall incidents.`,
    );
  }

  if (investigationRate >= 95 && totalIncidents > 0) {
    strengths.push(
      `${investigationRate}% of incidents fully investigated -- the home takes every slip, trip, and fall seriously with thorough investigation.`,
    );
  }

  if (rootCauseRate >= 90 && totalIncidents > 0) {
    strengths.push(
      `Root causes identified in ${rootCauseRate}% of incidents -- effective analysis driving targeted prevention.`,
    );
  }

  if (parentNotificationRate >= 95 && totalIncidents > 0) {
    strengths.push(
      `Parents/carers notified for ${parentNotificationRate}% of incidents -- transparent communication with families about safety events.`,
    );
  }

  if (firstAidRate >= 95 && injuriesSustained > 0) {
    strengths.push(
      `First aid administered in ${firstAidRate}% of injury-causing incidents -- strong immediate response capability.`,
    );
  }

  if (nearMissRate >= 30 && totalIncidents > 0) {
    strengths.push(
      `Near misses represent ${nearMissRate}% of all reported events -- proactive near-miss reporting culture supports prevention before harm occurs.`,
    );
  }

  if (staffAwarenessRate >= 90 && staffAwarenessNumerators.length > 0) {
    strengths.push(
      `Staff awareness composite at ${staffAwarenessRate}% -- staff are trained, sign off assessments, share lessons, and warn children about hazards consistently.`,
    );
  } else if (staffAwarenessRate >= 70 && staffAwarenessNumerators.length > 0) {
    strengths.push(
      `Staff awareness composite at ${staffAwarenessRate}% -- good staff engagement with slips, trips, and falls prevention.`,
    );
  }

  if (recurrenceRate === 0 && totalIncidents > 0) {
    strengths.push(
      "Zero recurrent incidents -- corrective actions are effectively preventing repeat occurrences of the same hazard.",
    );
  }

  // -- Concerns -------------------------------------------------------------

  const concerns: string[] = [];

  if (riskAssessmentRate < 50 && totalRiskAssessments > 0) {
    concerns.push(
      `Only ${riskAssessmentRate}% of slip/trip risk assessments have adequate controls -- the majority of assessed areas lack sufficient hazard controls, placing children at foreseeable risk of harm.`,
    );
  } else if (riskAssessmentRate < 70 && riskAssessmentRate >= 50 && totalRiskAssessments > 0) {
    concerns.push(
      `Risk assessment adequacy at ${riskAssessmentRate}% -- some areas lack sufficient controls to manage slip and trip hazards.`,
    );
  }

  if (reviewOverdueRate >= 30 && totalRiskAssessments > 0) {
    concerns.push(
      `${reviewOverdueRate}% of risk assessments are overdue for review -- outdated assessments may not reflect current hazards and changing needs.`,
    );
  }

  if (riskActionCompletionRate < 60 && totalRiskActions > 0) {
    concerns.push(
      `Only ${riskActionCompletionRate}% of risk assessment actions completed -- identified hazards are not being addressed, leaving children exposed to preventable risks.`,
    );
  }

  if (highCriticalRate >= 30 && totalRiskAssessments > 0) {
    concerns.push(
      `${highCriticalRate}% of risk assessments rated high or critical -- a significant proportion of the home's areas present elevated slip/trip risk.`,
    );
  }

  if (totalRiskAssessments === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No slip/trip risk assessments recorded despite children being on placement -- the home cannot evidence that premises hazards have been identified and controlled.",
    );
  }

  if (hazardousFlooringRate >= 20 && totalFlooringRecords > 0) {
    concerns.push(
      `${hazardousFlooringRate}% of flooring areas assessed as hazardous -- children are exposed to dangerous floor surfaces that pose an immediate safety risk.`,
    );
  }

  if (flooringConditionRate < 50 && totalFlooringRecords > 0) {
    concerns.push(
      `Only ${flooringConditionRate}% of flooring in acceptable condition -- the majority of floor surfaces are in poor or hazardous state, creating widespread trip and slip risks.`,
    );
  } else if (flooringConditionRate < 70 && flooringConditionRate >= 50 && totalFlooringRecords > 0) {
    concerns.push(
      `Flooring condition at ${flooringConditionRate}% -- some floor surfaces need repair or replacement to reduce slip and trip risks.`,
    );
  }

  if (tripHazardRate >= 30 && totalFlooringRecords > 0) {
    concerns.push(
      `Trip hazards present in ${tripHazardRate}% of flooring areas -- loose edges, raised thresholds, or uneven surfaces need urgent attention.`,
    );
  }

  if (slipResistanceRate < 70 && totalFlooringRecords > 0) {
    concerns.push(
      `Slip resistance adequate in only ${slipResistanceRate}% of areas -- insufficient traction on floor surfaces increases the risk of slips, particularly in wet conditions.`,
    );
  }

  if (repairCompletionRate < 50 && repairsNeeded > 0) {
    concerns.push(
      `Only ${repairCompletionRate}% of identified flooring repairs completed -- known defects remain unaddressed, leaving hazards in place.`,
    );
  }

  if (totalFlooringRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No flooring condition audits recorded -- the home cannot demonstrate that floor surfaces are regularly inspected and maintained to safe standards.",
    );
  }

  if (wetFloorProtocolRate < 50 && totalWetFloorRecords > 0) {
    concerns.push(
      `Wet floor protocol compliance at only ${wetFloorProtocolRate}% -- signage, cleaning schedules, spill response, and documentation are not being consistently followed, leaving children at risk from wet surfaces.`,
    );
  } else if (wetFloorProtocolRate < 70 && wetFloorProtocolRate >= 50 && totalWetFloorRecords > 0) {
    concerns.push(
      `Wet floor protocol compliance at ${wetFloorProtocolRate}% -- gaps in wet floor management procedures need to be addressed.`,
    );
  }

  if (spillResponseRate < 50 && totalWetFloorRecords > 0) {
    concerns.push(
      `Only ${spillResponseRate}% of spill responses within target time -- slow responses to wet floor hazards increase the window of risk for children.`,
    );
  }

  if (wetFloorIncidentRate >= 20 && totalWetFloorRecords > 0) {
    concerns.push(
      `Incidents resulted from ${wetFloorIncidentRate}% of wet floor events -- wet floor protocols are not effectively preventing harm.`,
    );
  }

  if (signageRate < 60 && totalWetFloorRecords > 0) {
    concerns.push(
      `Wet floor signage deployed on time in only ${signageRate}% of events -- children may encounter wet surfaces without adequate warning.`,
    );
  }

  if (totalWetFloorRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No wet floor protocol records -- the home cannot evidence that it has procedures for managing wet surface hazards or responding to spills.",
    );
  }

  if (stairwaySafetyRate < 50 && totalStairwayRecords > 0) {
    concerns.push(
      `Stairway safety compliance at only ${stairwaySafetyRate}% -- significant deficiencies in handrails, treads, lighting, clutter management, or carpet security on staircases.`,
    );
  } else if (stairwaySafetyRate < 70 && stairwaySafetyRate >= 50 && totalStairwayRecords > 0) {
    concerns.push(
      `Stairway safety compliance at ${stairwaySafetyRate}% -- some stairway safety elements need improvement.`,
    );
  }

  if (handrailRate < 80 && totalStairwayRecords > 0) {
    concerns.push(
      `Handrails secure in only ${handrailRate}% of stairways -- loose or missing handrails are a significant fall hazard, particularly for younger children.`,
    );
  }

  if (stairLightingRate < 70 && totalStairwayRecords > 0) {
    concerns.push(
      `Stairway lighting adequate in only ${stairLightingRate}% of inspections -- poor lighting on stairs significantly increases fall risk.`,
    );
  }

  if (clutterFreeRate < 70 && totalStairwayRecords > 0) {
    concerns.push(
      `Only ${clutterFreeRate}% of stairways clutter-free -- objects on stairs are a direct trip hazard that must be managed consistently.`,
    );
  }

  if (totalStairwayRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No stairway safety inspection records -- the home cannot demonstrate that staircases are regularly inspected for safety compliance.",
    );
  }

  if (seriousMajorRate >= 30 && totalIncidents > 0) {
    concerns.push(
      `${seriousMajorRate}% of incidents classified as serious or major -- the home has a disproportionate number of high-severity slip, trip, and fall events.`,
    );
  }

  if (recurrenceRate >= 25 && totalIncidents > 0) {
    concerns.push(
      `${recurrenceRate}% of incidents are recurrences -- corrective actions from previous incidents are not effectively preventing repeat occurrences.`,
    );
  }

  if (incidentLearningRate < 50 && totalIncidents > 0) {
    concerns.push(
      `Incident learning rate at only ${incidentLearningRate}% -- the home is not consistently investigating incidents, identifying root causes, documenting lessons, or updating risk assessments after slip, trip, and fall events.`,
    );
  } else if (incidentLearningRate < 70 && incidentLearningRate >= 50 && totalIncidents > 0) {
    concerns.push(
      `Incident learning rate at ${incidentLearningRate}% -- some aspects of post-incident learning need strengthening.`,
    );
  }

  if (investigationRate < 70 && totalIncidents > 0) {
    concerns.push(
      `Only ${investigationRate}% of incidents fully investigated -- incomplete investigations leave the home unable to identify and address systemic causes.`,
    );
  }

  if (riskAssessmentUpdatedRate < 50 && totalIncidents > 0) {
    concerns.push(
      `Risk assessments updated after only ${riskAssessmentUpdatedRate}% of incidents -- lessons from incidents are not being fed back into risk assessments, perpetuating hazards.`,
    );
  }

  if (parentNotificationRate < 80 && totalIncidents > 0) {
    concerns.push(
      `Parents/carers notified for only ${parentNotificationRate}% of incidents -- inconsistent communication with families about safety events undermines transparency and trust.`,
    );
  }

  if (staffAwarenessRate < 50 && staffAwarenessNumerators.length > 0) {
    concerns.push(
      `Staff awareness composite at only ${staffAwarenessRate}% -- staff training, sign-off, lesson sharing, and hazard warning practices are insufficient.`,
    );
  }

  if (medicalRate >= 30 && totalIncidents > 0) {
    concerns.push(
      `Medical attention required for ${medicalRate}% of incidents -- the severity of injuries from slips, trips, and falls is concerning and suggests inadequate prevention.`,
    );
  }

  // -- Recommendations ------------------------------------------------------

  const recommendations: SlipsTripsFallsRecommendation[] = [];
  let rank = 0;

  if (riskAssessmentRate < 50 && totalRiskAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review all slip/trip risk assessments and implement adequate controls for every identified hazard. Ensure assessments are signed off by management and reviewed at the required frequency.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises",
    });
  }

  if (hazardousFlooringRate >= 20 && totalFlooringRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Take immediate action to repair or replace all flooring assessed as hazardous. Restrict access to hazardous areas until remediation is complete and implement temporary safety measures.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises",
    });
  }

  if (seriousMajorRate >= 30 && totalIncidents > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Conduct a comprehensive review of all serious and major slip, trip, and fall incidents. Identify common contributing factors and implement targeted prevention measures to reduce injury severity.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 -- Engaging, helping, protecting",
    });
  }

  if (recurrenceRate >= 25 && totalIncidents > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Investigate all recurrent incidents to determine why previous corrective actions failed. Strengthen post-incident follow-up procedures to ensure actions are implemented and effective.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 -- Engaging, helping, protecting",
    });
  }

  if (totalRiskAssessments === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement slip, trip, and fall risk assessments for all areas of the home including outdoor spaces. Document hazards, controls, and review schedules to evidence Reg 25 compliance.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises",
    });
  }

  if (totalStairwayRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish stairway safety inspections covering handrails, treads, lighting, clutter, and carpet security. Inspect all staircases at regular intervals and record findings.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises",
    });
  }

  if (handrailRate < 80 && totalStairwayRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Repair or install secure handrails on all staircases. Handrails are a critical fall prevention measure, particularly for younger and less mobile children.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises",
    });
  }

  if (stairLightingRate < 70 && totalStairwayRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve stairway lighting to ensure all staircases are adequately illuminated. Consider motion-sensor lighting for stairs used at night.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises",
    });
  }

  if (flooringConditionRate < 50 && totalFlooringRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop a flooring maintenance and replacement programme prioritising the most degraded surfaces. Ensure all areas meet slip resistance standards and are free from trip hazards.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises",
    });
  }

  if (spillResponseRate < 50 && totalWetFloorRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review and strengthen spill response procedures. Ensure cleaning materials and signage are accessible in all areas and that staff know the target response time for wet floor hazards.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises",
    });
  }

  if (wetFloorProtocolRate < 50 && totalWetFloorRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Overhaul wet floor management protocols -- establish clear procedures for signage deployment, cleaning schedules, spill response times, and documentation. Train all staff on the revised protocols.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises",
    });
  }

  if (incidentLearningRate < 50 && totalIncidents > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a structured post-incident learning process for all slip, trip, and fall events. Every incident should be investigated, root causes identified, lessons documented and shared with staff, and risk assessments updated accordingly.",
      urgency: "soon",
      regulatory_ref: "SCCIF -- Safety of children",
    });
  }

  if (repairCompletionRate < 50 && repairsNeeded > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Prioritise and complete all outstanding flooring repairs. Implement a tracking system to monitor repair progress and escalate unresolved defects.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises",
    });
  }

  if (signageRate < 60 && totalWetFloorRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure wet floor signage is deployed promptly for every wet surface event. Audit signage availability and placement across the home.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises",
    });
  }

  if (clutterFreeRate < 70 && totalStairwayRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Reinforce expectations with staff and children that stairways must remain clutter-free at all times. Include stairway clutter checks in daily walkround routines.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises",
    });
  }

  if (staffAwarenessRate < 50 && staffAwarenessNumerators.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Deliver targeted training for all staff on slip, trip, and fall prevention including hazard recognition, wet floor protocols, incident reporting, and organisational learning.",
      urgency: "soon",
      regulatory_ref: "SCCIF -- Safety of children",
    });
  }

  if (riskAssessmentRate >= 50 && riskAssessmentRate < 70 && totalRiskAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve risk assessment adequacy to at least 70% -- review assessments with inadequate controls and strengthen mitigation measures for each identified hazard.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises",
    });
  }

  if (flooringConditionRate >= 50 && flooringConditionRate < 70 && totalFlooringRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Schedule a programme of flooring improvements targeting areas in poor condition. Prioritise high-traffic areas and those used by younger or less mobile children.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises",
    });
  }

  if (wetFloorProtocolRate >= 50 && wetFloorProtocolRate < 70 && totalWetFloorRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen wet floor protocol compliance to at least 70% -- focus on areas with the lowest compliance and provide refresher training to staff working in those areas.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises",
    });
  }

  if (stairwaySafetyRate >= 50 && stairwaySafetyRate < 70 && totalStairwayRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve stairway safety compliance to at least 70% -- address specific deficiencies in handrails, treads, lighting, or clutter management identified in inspections.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises",
    });
  }

  if (childrenConsultedRate < 50 && totalRiskAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Involve children in slip, trip, and fall risk assessments through house meetings, walkrounds, or individual consultations. Children often identify hazards adults overlook.",
      urgency: "planned",
      regulatory_ref: "SCCIF -- Experiences and progress of children",
    });
  }

  if (totalFlooringRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish flooring condition audits across all areas of the home. Inspect slip resistance, trip hazards, thresholds, and mat security on a regular schedule.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises",
    });
  }

  if (totalWetFloorRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop and implement wet floor management protocols including signage deployment, cleaning schedules, spill response targets, and entrance matting assessments.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises",
    });
  }

  if (parentNotificationRate < 80 && totalIncidents > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review notification procedures to ensure parents/carers are informed of all slip, trip, and fall incidents involving their child. Consistent communication supports transparency and partnership.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 -- Engaging, helping, protecting",
    });
  }

  if (reviewOverdueRate >= 30 && totalRiskAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Bring all overdue risk assessment reviews up to date. Implement a review schedule tracker to ensure assessments are reviewed before their due dates.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises",
    });
  }

  // -- Insights -------------------------------------------------------------

  const insights: SlipsTripsFallsInsight[] = [];

  // --- Critical insights ---

  if (riskAssessmentRate < 50 && totalRiskAssessments > 0) {
    insights.push({
      text: `Only ${riskAssessmentRate}% of slip/trip risk assessments have adequate controls. Ofsted will view the failure to control identified premises hazards as evidence that the home does not meet the Reg 25 requirement to ensure premises are safe and suitable for children.`,
      severity: "critical",
    });
  }

  if (hazardousFlooringRate >= 20 && totalFlooringRecords > 0) {
    insights.push({
      text: `${hazardousFlooringRate}% of flooring areas assessed as hazardous. Dangerous floor surfaces present an immediate and foreseeable risk of injury to children. Ofsted will expect immediate remediation and may view this as a Reg 25 breach requiring urgent action.`,
      severity: "critical",
    });
  }

  if (seriousMajorRate >= 30 && totalIncidents > 0) {
    insights.push({
      text: `${seriousMajorRate}% of slip, trip, and fall incidents classified as serious or major. The disproportionate severity of incidents suggests systemic failings in hazard prevention. Ofsted will expect a comprehensive improvement plan under Reg 5 and SCCIF safety requirements.`,
      severity: "critical",
    });
  }

  if (recurrenceRate >= 25 && totalIncidents > 0) {
    insights.push({
      text: `${recurrenceRate}% of incidents are recurrences of previously identified hazards. Repeat incidents demonstrate that corrective actions are not effectively preventing harm. Ofsted will view this as a failure to learn from incidents and protect children.`,
      severity: "critical",
    });
  }

  if (totalRiskAssessments === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No slip/trip risk assessments exist despite children being on placement. Ofsted will view the absence of premises risk assessments as evidence that the home has not identified or controlled foreseeable hazards -- a fundamental Reg 25 failure.",
      severity: "critical",
    });
  }

  if (handrailRate < 60 && totalStairwayRecords > 0) {
    insights.push({
      text: `Handrails secure in only ${handrailRate}% of stairways. Unsecured or missing handrails are among the most significant fall hazards in residential settings. Ofsted will expect immediate remediation of all handrail deficiencies.`,
      severity: "critical",
    });
  }

  // --- Warning insights ---

  if (riskAssessmentRate >= 50 && riskAssessmentRate < 70 && totalRiskAssessments > 0) {
    insights.push({
      text: `Risk assessment adequacy at ${riskAssessmentRate}% -- improving but some areas still lack sufficient controls. Each uncontrolled hazard represents a foreseeable risk that the home has a duty to manage.`,
      severity: "warning",
    });
  }

  if (flooringConditionRate >= 50 && flooringConditionRate < 70 && totalFlooringRecords > 0) {
    insights.push({
      text: `Flooring condition at ${flooringConditionRate}% -- while some surfaces meet standards, others need attention. A proactive maintenance programme would prevent deterioration and reduce risk.`,
      severity: "warning",
    });
  }

  if (wetFloorProtocolRate >= 50 && wetFloorProtocolRate < 90 && totalWetFloorRecords > 0) {
    insights.push({
      text: `Wet floor protocol compliance at ${wetFloorProtocolRate}% -- gaps in signage, cleaning, or spill response leave windows of risk. Consistent protocol adherence is essential given that wet surfaces are a leading cause of slips.`,
      severity: "warning",
    });
  }

  if (stairwaySafetyRate >= 50 && stairwaySafetyRate < 90 && totalStairwayRecords > 0) {
    insights.push({
      text: `Stairway safety compliance at ${stairwaySafetyRate}% -- while most elements are satisfactory, specific deficiencies in handrails, lighting, or treads need targeted remediation.`,
      severity: "warning",
    });
  }

  if (incidentLearningRate >= 50 && incidentLearningRate < 90 && totalIncidents > 0) {
    insights.push({
      text: `Incident learning rate at ${incidentLearningRate}% -- some post-incident learning is happening but not consistently across all five learning domains. Strengthening root cause analysis and risk assessment updates would improve prevention.`,
      severity: "warning",
    });
  }

  if (reviewOverdueRate >= 30 && totalRiskAssessments > 0) {
    insights.push({
      text: `${reviewOverdueRate}% of risk assessments overdue for review. Outdated assessments may not reflect current premises conditions, seasonal changes, or new children's needs. Ofsted expects risk assessments to be live documents.`,
      severity: "warning",
    });
  }

  if (tripHazardRate >= 30 && totalFlooringRecords > 0) {
    insights.push({
      text: `Trip hazards present in ${tripHazardRate}% of flooring areas. Loose mats, raised thresholds, uneven surfaces, and damaged flooring are the most common causes of trips in residential settings and need systematic attention.`,
      severity: "warning",
    });
  }

  if (slipResistanceRate >= 50 && slipResistanceRate < 70 && totalFlooringRecords > 0) {
    insights.push({
      text: `Slip resistance adequate in only ${slipResistanceRate}% of areas. Floor surfaces should be assessed for appropriate slip resistance, particularly in wet areas such as bathrooms, kitchens, and entrances.`,
      severity: "warning",
    });
  }

  if (staffAwarenessRate >= 50 && staffAwarenessRate < 90 && staffAwarenessNumerators.length > 0) {
    insights.push({
      text: `Staff awareness composite at ${staffAwarenessRate}% -- while staff are engaged with some aspects of falls prevention, gaps in training, sign-off, or lesson sharing could undermine the home's overall safety culture.`,
      severity: "warning",
    });
  }

  if (wetFloorIncidentRate >= 10 && wetFloorIncidentRate < 20 && totalWetFloorRecords > 0) {
    insights.push({
      text: `Incidents resulted from ${wetFloorIncidentRate}% of wet floor events. While not at critical levels, any incident from a manageable hazard represents a prevention failure that should be investigated.`,
      severity: "warning",
    });
  }

  if (medicalRate >= 15 && medicalRate < 30 && totalIncidents > 0) {
    insights.push({
      text: `Medical attention required for ${medicalRate}% of incidents. While most injuries are minor, the proportion requiring medical treatment suggests scope for improved prevention.`,
      severity: "warning",
    });
  }

  // --- Positive insights ---

  if (falls_prevention_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding slips, trips, and falls prevention -- risk assessments are thorough, flooring is well maintained, wet floor protocols are consistently followed, stairways are safe, and incidents drive genuine organisational learning. This is strong evidence for Reg 25 compliance and effective premises safety management.",
      severity: "positive",
    });
  }

  if (riskAssessmentRate >= 90 && riskActionCompletionRate >= 90 && totalRiskAssessments > 0 && totalRiskActions > 0) {
    insights.push({
      text: `${riskAssessmentRate}% risk assessment adequacy with ${riskActionCompletionRate}% action completion -- the home identifies hazards and follows through on controls with excellent consistency. Ofsted will recognise this as evidence of a well-managed, proactive premises safety regime.`,
      severity: "positive",
    });
  }

  if (flooringConditionRate >= 90 && slipResistanceRate >= 90 && totalFlooringRecords > 0) {
    insights.push({
      text: `${flooringConditionRate}% flooring in good/fair condition with ${slipResistanceRate}% adequate slip resistance -- floor surfaces throughout the home provide a safe environment for children. This reflects ongoing investment in premises quality.`,
      severity: "positive",
    });
  }

  if (wetFloorProtocolRate >= 90 && spillResponseRate >= 90 && totalWetFloorRecords > 0) {
    insights.push({
      text: `Wet floor protocol compliance at ${wetFloorProtocolRate}% with ${spillResponseRate}% of spills responded to within target time -- the home has embedded effective wet floor management into daily practice. This proactive approach minimises a common and preventable hazard.`,
      severity: "positive",
    });
  }

  if (stairwaySafetyRate >= 90 && handrailRate >= 95 && totalStairwayRecords > 0) {
    insights.push({
      text: `Stairway safety at ${stairwaySafetyRate}% with ${handrailRate}% handrail security -- staircases throughout the home meet or exceed safety standards. This is particularly important for younger children and those with mobility considerations.`,
      severity: "positive",
    });
  }

  if (incidentLearningRate >= 90 && recurrenceRate === 0 && totalIncidents > 0) {
    insights.push({
      text: `Incident learning rate at ${incidentLearningRate}% with zero recurrences -- the home demonstrates exemplary organisational learning from every slip, trip, and fall event. Investigations, root cause analysis, lessons learned, and risk assessment updates are driving genuine prevention.`,
      severity: "positive",
    });
  }

  if (nearMissRate >= 30 && totalIncidents > 0) {
    insights.push({
      text: `Near misses represent ${nearMissRate}% of all reported events -- the home has cultivated a proactive reporting culture where potential hazards are identified before they cause harm. This is a hallmark of a safety-mature organisation.`,
      severity: "positive",
    });
  }

  if (staffAwarenessRate >= 90 && staffAwarenessNumerators.length > 0) {
    insights.push({
      text: `Staff awareness composite at ${staffAwarenessRate}% -- staff are fully engaged with falls prevention through training, risk assessment sign-off, lesson sharing, and proactive hazard warnings. This embedded safety culture protects children effectively.`,
      severity: "positive",
    });
  }

  if (childrenConsultedRate >= 80 && totalRiskAssessments > 0) {
    insights.push({
      text: `Children consulted in ${childrenConsultedRate}% of risk assessments -- involving children in premises safety reflects the home's commitment to participation and often identifies hazards that adults miss. Ofsted will view this positively under SCCIF.`,
      severity: "positive",
    });
  }

  if (firstAidRate >= 95 && injuriesSustained > 0) {
    insights.push({
      text: `First aid administered in ${firstAidRate}% of injury-causing incidents -- the home's immediate response capability ensures children receive prompt care when injuries occur. This demonstrates good first aid readiness and staff competence.`,
      severity: "positive",
    });
  }

  // -- Headline -------------------------------------------------------------

  let headline: string;

  if (falls_prevention_rating === "outstanding") {
    headline =
      "Outstanding slips, trips, and falls prevention -- risk assessments, flooring, wet floor protocols, stairway safety, and incident learning all demonstrate exemplary premises safety management.";
  } else if (falls_prevention_rating === "good") {
    headline = `Good slips, trips, and falls prevention -- ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (falls_prevention_rating === "adequate") {
    headline = `Adequate slips, trips, and falls prevention -- ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure premises are safe from slip, trip, and fall hazards.`;
  } else {
    headline = `Slips, trips, and falls prevention is inadequate -- ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure children are protected from foreseeable premises hazards.`;
  }

  // -- Return ---------------------------------------------------------------

  return {
    falls_prevention_rating,
    falls_prevention_score: score,
    headline,
    risk_assessment_rate: riskAssessmentRate,
    flooring_condition_rate: flooringConditionRate,
    wet_floor_protocol_rate: wetFloorProtocolRate,
    stairway_safety_rate: stairwaySafetyRate,
    incident_learning_rate: incidentLearningRate,
    staff_awareness_rate: staffAwarenessRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
