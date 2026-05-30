// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME DAMP & MOULD MANAGEMENT INTELLIGENCE ENGINE
// Monitors the home's damp survey completion, mould inspection frequency,
// remediation tracking, ventilation assessment adequacy, and child health
// impact monitoring.
// Measures damp survey rates, mould inspection rates, remediation completion,
// ventilation adequacy, health impact monitoring, and child awareness.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 25 (Premises), Reg 14 (Health).
// SCCIF: "Safety", "Quality of care", "Living in the home".
// Store keys: dampSurveyRecords, mouldInspectionRecords, remediationRecords,
//             ventilationAssessmentRecords, healthImpactRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface DampSurveyRecordInput {
  id: string;
  date: string;
  surveyor: string;
  survey_type: "routine" | "reactive" | "annual" | "post_repair" | "pre_admission" | "specialist";
  area_surveyed: string;
  damp_detected: boolean;
  damp_type: "rising" | "penetrating" | "condensation" | "none" | "unknown";
  severity: "none" | "mild" | "moderate" | "severe" | "critical";
  moisture_reading: number;
  moisture_threshold: number;
  within_acceptable_range: boolean;
  photographs_taken: boolean;
  action_required: boolean;
  action_taken: boolean;
  follow_up_date: string | null;
  follow_up_completed: boolean;
  child_rooms_affected: boolean;
  rooms_affected_count: number;
  recommendations_made: number;
  recommendations_actioned: number;
  notes: string;
  created_at: string;
}

export interface MouldInspectionRecordInput {
  id: string;
  date: string;
  inspector: string;
  inspection_type: "routine" | "reactive" | "monthly" | "quarterly" | "post_treatment" | "complaint_driven";
  area_inspected: string;
  mould_found: boolean;
  mould_type: "black" | "white" | "green" | "pink" | "none" | "unknown";
  surface_area_affected_sqm: number;
  severity: "none" | "minor" | "moderate" | "significant" | "hazardous";
  location_type: "bedroom" | "bathroom" | "kitchen" | "living_area" | "hallway" | "utility" | "storage" | "other";
  child_bedroom_affected: boolean;
  spore_risk_assessed: boolean;
  immediate_action_taken: boolean;
  treatment_applied: boolean;
  treatment_type: string;
  re_inspection_scheduled: boolean;
  re_inspection_date: string | null;
  photographs_taken: boolean;
  reported_to_management: boolean;
  notes: string;
  created_at: string;
}

export interface RemediationRecordInput {
  id: string;
  date_raised: string;
  date_completed: string | null;
  remediation_type: "damp_proofing" | "mould_treatment" | "ventilation_install" | "structural_repair" | "redecoration" | "drainage" | "insulation" | "dehumidifier" | "other";
  contractor: string;
  area_treated: string;
  severity_at_referral: "mild" | "moderate" | "severe" | "critical";
  completed: boolean;
  completed_within_target: boolean;
  target_days: number;
  actual_days: number;
  cost_gbp: number;
  quality_checked: boolean;
  quality_satisfactory: boolean;
  follow_up_inspection_completed: boolean;
  recurrence_detected: boolean;
  child_room_involved: boolean;
  child_temporarily_relocated: boolean;
  child_informed_of_works: boolean;
  warranty_period_months: number;
  warranty_active: boolean;
  notes: string;
  created_at: string;
}

export interface VentilationAssessmentRecordInput {
  id: string;
  date: string;
  assessor: string;
  room_assessed: string;
  room_type: "bedroom" | "bathroom" | "kitchen" | "living_area" | "hallway" | "utility" | "laundry" | "other";
  ventilation_type: "natural" | "mechanical" | "trickle_vents" | "extractor_fan" | "hvac" | "passive" | "none";
  ventilation_adequate: boolean;
  airflow_measured: boolean;
  airflow_rate_lps: number;
  minimum_required_lps: number;
  meets_building_regs: boolean;
  humidity_level_percent: number;
  humidity_acceptable: boolean;
  extractor_fan_working: boolean;
  trickle_vents_open: boolean;
  windows_openable: boolean;
  condensation_observed: boolean;
  recommendations_made: number;
  recommendations_actioned: number;
  child_bedroom: boolean;
  maintenance_required: boolean;
  maintenance_completed: boolean;
  notes: string;
  created_at: string;
}

export interface HealthImpactRecordInput {
  id: string;
  child_id: string;
  date: string;
  health_concern_type: "respiratory" | "asthma" | "allergic_reaction" | "skin_condition" | "eye_irritation" | "headache" | "other";
  linked_to_damp_mould: boolean;
  confirmed_by_professional: boolean;
  professional_type: "gp" | "nurse" | "specialist" | "hospital" | "pharmacist" | "none";
  severity: "mild" | "moderate" | "severe";
  treatment_required: boolean;
  treatment_provided: boolean;
  medication_prescribed: boolean;
  days_affected: number;
  school_absence: boolean;
  school_absence_days: number;
  room_assessment_triggered: boolean;
  remediation_triggered: boolean;
  environment_modified: boolean;
  child_views_recorded: boolean;
  social_worker_informed: boolean;
  placing_authority_informed: boolean;
  follow_up_health_check: boolean;
  follow_up_completed: boolean;
  outcome: "resolved" | "ongoing" | "recurring" | "referred";
  notes: string;
  created_at: string;
}

export interface DampMouldManagementInput {
  today: string;
  total_children: number;
  damp_survey_records: DampSurveyRecordInput[];
  mould_inspection_records: MouldInspectionRecordInput[];
  remediation_records: RemediationRecordInput[];
  ventilation_assessment_records: VentilationAssessmentRecordInput[];
  health_impact_records: HealthImpactRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type DampMouldRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface DampMouldInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface DampMouldRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface DampMouldManagementResult {
  damp_rating: DampMouldRating;
  damp_score: number;
  headline: string;
  total_damp_surveys: number;
  total_mould_inspections: number;
  total_remediations: number;
  total_ventilation_assessments: number;
  total_health_impacts: number;
  damp_survey_rate: number;
  mould_inspection_rate: number;
  remediation_rate: number;
  ventilation_rate: number;
  health_impact_rate: number;
  child_awareness_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: DampMouldRecommendation[];
  insights: DampMouldInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): DampMouldRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: DampMouldRating,
  score: number,
  headline: string,
): DampMouldManagementResult {
  return {
    damp_rating: rating,
    damp_score: score,
    headline,
    total_damp_surveys: 0,
    total_mould_inspections: 0,
    total_remediations: 0,
    total_ventilation_assessments: 0,
    total_health_impacts: 0,
    damp_survey_rate: 0,
    mould_inspection_rate: 0,
    remediation_rate: 0,
    ventilation_rate: 0,
    health_impact_rate: 0,
    child_awareness_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeDampMouldManagement(
  input: DampMouldManagementInput,
): DampMouldManagementResult {
  const {
    total_children,
    damp_survey_records,
    mould_inspection_records,
    remediation_records,
    ventilation_assessment_records,
    health_impact_records,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    damp_survey_records.length === 0 &&
    mould_inspection_records.length === 0 &&
    remediation_records.length === 0 &&
    ventilation_assessment_records.length === 0 &&
    health_impact_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess damp and mould management.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No damp and mould management data recorded despite children on placement — damp surveys, mould inspections, and ventilation assessments require urgent attention.",
      ),
      concerns: [
        "No damp survey records, mould inspection records, remediation records, ventilation assessment records, or health impact records exist despite children being on placement — the home cannot evidence safe premises management or protection of children's respiratory health.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured recording of damp surveys, mould inspections, remediation works, ventilation assessments, and any child health impacts linked to damp or mould — this is essential to evidence compliance with CHR 2015 Reg 25 (Premises) and Reg 14 (Health).",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 25 — Premises",
        },
        {
          rank: 2,
          recommendation:
            "Commission an immediate comprehensive damp and mould survey of the entire premises, prioritising children's bedrooms, bathrooms, and communal living areas — this must include moisture readings, ventilation adequacy, and any visible mould growth.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 14 — Health",
        },
      ],
      insights: [
        {
          text: "The complete absence of damp and mould management records means the home cannot demonstrate it is actively monitoring and managing the premises to protect children's health and safety. Damp and mould pose serious risks to children's respiratory health, particularly for those with asthma or allergies. This represents a significant gap in premises safety and children's health protection.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- Damp survey metrics ---
  const totalDampSurveys = damp_survey_records.length;
  const surveysWithinRange = damp_survey_records.filter(
    (s) => s.within_acceptable_range,
  ).length;
  const dampSurveyRate = pct(surveysWithinRange, totalDampSurveys);

  const dampDetected = damp_survey_records.filter((s) => s.damp_detected).length;
  const dampDetectionRate = pct(dampDetected, totalDampSurveys);

  const actionsRequired = damp_survey_records.filter((s) => s.action_required).length;
  const actionsTaken = damp_survey_records.filter(
    (s) => s.action_required && s.action_taken,
  ).length;
  const actionCompletionRate = pct(actionsTaken, actionsRequired);

  const followUpsRequired = damp_survey_records.filter(
    (s) => s.follow_up_date !== null,
  ).length;
  const followUpsCompleted = damp_survey_records.filter(
    (s) => s.follow_up_date !== null && s.follow_up_completed,
  ).length;
  const followUpCompletionRate = pct(followUpsCompleted, followUpsRequired);

  const childRoomsAffectedSurvey = damp_survey_records.filter(
    (s) => s.child_rooms_affected,
  ).length;
  const childRoomAffectedRate = pct(childRoomsAffectedSurvey, totalDampSurveys);

  const totalRecsAdeSurvey = damp_survey_records.reduce(
    (sum, s) => sum + s.recommendations_made,
    0,
  );
  const totalRecsActionedSurvey = damp_survey_records.reduce(
    (sum, s) => sum + s.recommendations_actioned,
    0,
  );
  const surveyRecsActionedRate = pct(totalRecsActionedSurvey, totalRecsAdeSurvey);

  const severeSurveys = damp_survey_records.filter(
    (s) => s.severity === "severe" || s.severity === "critical",
  ).length;
  const severeSurveyRate = pct(severeSurveys, totalDampSurveys);

  // --- Mould inspection metrics ---
  const totalMouldInspections = mould_inspection_records.length;
  const mouldFound = mould_inspection_records.filter((m) => m.mould_found).length;
  const mouldDetectionRate = pct(mouldFound, totalMouldInspections);

  const inspectionsWithNoMould = totalMouldInspections - mouldFound;
  const mouldFreeRate = pct(inspectionsWithNoMould, totalMouldInspections);
  // mould_inspection_rate: percentage of inspections where no mould was found (i.e. clean inspection rate)
  const mouldInspectionRate = mouldFreeRate;

  const childBedroomAffected = mould_inspection_records.filter(
    (m) => m.child_bedroom_affected,
  ).length;
  const childBedroomMouldRate = pct(childBedroomAffected, totalMouldInspections);

  const sporeRiskAssessed = mould_inspection_records.filter(
    (m) => m.mould_found && m.spore_risk_assessed,
  ).length;
  const sporeAssessmentRate = pct(sporeRiskAssessed, mouldFound);

  const immediateActionOnMould = mould_inspection_records.filter(
    (m) => m.mould_found && m.immediate_action_taken,
  ).length;
  const immediateActionRate = pct(immediateActionOnMould, mouldFound);

  const reportedToManagement = mould_inspection_records.filter(
    (m) => m.mould_found && m.reported_to_management,
  ).length;
  const managementReportingRate = pct(reportedToManagement, mouldFound);

  // --- Remediation metrics ---
  const totalRemediations = remediation_records.length;
  const completedRemediations = remediation_records.filter(
    (r) => r.completed,
  ).length;
  const remediationRate = pct(completedRemediations, totalRemediations);

  const completedWithinTarget = remediation_records.filter(
    (r) => r.completed && r.completed_within_target,
  ).length;
  const withinTargetRate = pct(completedWithinTarget, completedRemediations);

  const qualityChecked = remediation_records.filter(
    (r) => r.completed && r.quality_checked,
  ).length;
  const qualityCheckRate = pct(qualityChecked, completedRemediations);

  const qualitySatisfactory = remediation_records.filter(
    (r) => r.completed && r.quality_checked && r.quality_satisfactory,
  ).length;
  const qualitySatisfactoryRate = pct(qualitySatisfactory, qualityChecked);

  const followUpInspectionsDone = remediation_records.filter(
    (r) => r.completed && r.follow_up_inspection_completed,
  ).length;
  const followUpInspectionRate = pct(followUpInspectionsDone, completedRemediations);

  const recurrenceDetected = remediation_records.filter(
    (r) => r.completed && r.recurrence_detected,
  ).length;
  const recurrenceRate = pct(recurrenceDetected, completedRemediations);

  const childRoomRemediation = remediation_records.filter(
    (r) => r.child_room_involved,
  ).length;
  const childRoomRemediationRate = pct(childRoomRemediation, totalRemediations);

  const childInformedWorks = remediation_records.filter(
    (r) => r.child_room_involved && r.child_informed_of_works,
  ).length;
  const childInformedWorksRate = pct(childInformedWorks, childRoomRemediation);

  const outstandingRemediations = remediation_records.filter(
    (r) => !r.completed,
  ).length;

  // --- Ventilation assessment metrics ---
  const totalVentilationAssessments = ventilation_assessment_records.length;
  const adequateVentilation = ventilation_assessment_records.filter(
    (v) => v.ventilation_adequate,
  ).length;
  const ventilationRate = pct(adequateVentilation, totalVentilationAssessments);

  const meetsBuildingRegs = ventilation_assessment_records.filter(
    (v) => v.meets_building_regs,
  ).length;
  const buildingRegsRate = pct(meetsBuildingRegs, totalVentilationAssessments);

  const humidityAcceptable = ventilation_assessment_records.filter(
    (v) => v.humidity_acceptable,
  ).length;
  const humidityAcceptableRate = pct(
    humidityAcceptable,
    totalVentilationAssessments,
  );

  const extractorFanWorking = ventilation_assessment_records.filter(
    (v) =>
      (v.ventilation_type === "extractor_fan" || v.ventilation_type === "mechanical") &&
      v.extractor_fan_working,
  ).length;
  const extractorFanTotal = ventilation_assessment_records.filter(
    (v) =>
      v.ventilation_type === "extractor_fan" || v.ventilation_type === "mechanical",
  ).length;
  const extractorFanWorkingRate = pct(extractorFanWorking, extractorFanTotal);

  const condensationObserved = ventilation_assessment_records.filter(
    (v) => v.condensation_observed,
  ).length;
  const condensationRate = pct(condensationObserved, totalVentilationAssessments);

  const childBedroomVentilation = ventilation_assessment_records.filter(
    (v) => v.child_bedroom && v.ventilation_adequate,
  ).length;
  const childBedroomVentilationTotal = ventilation_assessment_records.filter(
    (v) => v.child_bedroom,
  ).length;
  const childBedroomVentilationRate = pct(
    childBedroomVentilation,
    childBedroomVentilationTotal,
  );

  const maintenanceRequired = ventilation_assessment_records.filter(
    (v) => v.maintenance_required,
  ).length;
  const maintenanceCompleted = ventilation_assessment_records.filter(
    (v) => v.maintenance_required && v.maintenance_completed,
  ).length;
  const maintenanceCompletionRate = pct(maintenanceCompleted, maintenanceRequired);

  const ventRecsTotal = ventilation_assessment_records.reduce(
    (sum, v) => sum + v.recommendations_made,
    0,
  );
  const ventRecsActioned = ventilation_assessment_records.reduce(
    (sum, v) => sum + v.recommendations_actioned,
    0,
  );
  const ventRecsActionedRate = pct(ventRecsActioned, ventRecsTotal);

  // --- Health impact metrics ---
  const totalHealthImpacts = health_impact_records.length;
  const linkedToDampMould = health_impact_records.filter(
    (h) => h.linked_to_damp_mould,
  ).length;

  const treatmentRequiredHealth = health_impact_records.filter(
    (h) => h.treatment_required,
  ).length;
  const treatmentProvidedHealth = health_impact_records.filter(
    (h) => h.treatment_required && h.treatment_provided,
  ).length;
  const treatmentProvisionRate = pct(
    treatmentProvidedHealth,
    treatmentRequiredHealth,
  );

  const childViewsRecorded = health_impact_records.filter(
    (h) => h.child_views_recorded,
  ).length;
  const childViewsRate = pct(childViewsRecorded, totalHealthImpacts);

  const socialWorkerInformed = health_impact_records.filter(
    (h) => h.social_worker_informed,
  ).length;
  const socialWorkerInformedRate = pct(socialWorkerInformed, totalHealthImpacts);

  const placingAuthorityInformed = health_impact_records.filter(
    (h) => h.placing_authority_informed,
  ).length;
  const placingAuthorityInformedRate = pct(
    placingAuthorityInformed,
    totalHealthImpacts,
  );

  const followUpHealthChecks = health_impact_records.filter(
    (h) => h.follow_up_health_check,
  ).length;
  const followUpHealthCompleted = health_impact_records.filter(
    (h) => h.follow_up_health_check && h.follow_up_completed,
  ).length;
  const followUpHealthRate = pct(followUpHealthCompleted, followUpHealthChecks);

  const severeHealthImpacts = health_impact_records.filter(
    (h) => h.severity === "severe",
  ).length;
  const severeHealthRate = pct(severeHealthImpacts, totalHealthImpacts);

  const resolvedOutcomes = health_impact_records.filter(
    (h) => h.outcome === "resolved",
  ).length;
  const resolvedRate = pct(resolvedOutcomes, totalHealthImpacts);

  const recurringOutcomes = health_impact_records.filter(
    (h) => h.outcome === "recurring",
  ).length;
  const recurringRate = pct(recurringOutcomes, totalHealthImpacts);

  const schoolAbsences = health_impact_records.filter(
    (h) => h.school_absence,
  ).length;
  const schoolAbsenceRate = pct(schoolAbsences, totalHealthImpacts);

  const totalSchoolAbsenceDays = health_impact_records.reduce(
    (sum, h) => sum + h.school_absence_days,
    0,
  );

  // health_impact_rate: percentage of health impacts where treatment was provided
  // (captures response quality to health concerns)
  const healthImpactRate = treatmentProvisionRate;

  // --- Child awareness composite ---
  // Composite across: child views recorded in health impacts, child informed of
  // remediation works, and child room ventilation adequacy
  const awarenessNumerators: number[] = [];
  const awarenessDenominators: number[] = [];

  if (totalHealthImpacts > 0) {
    awarenessNumerators.push(childViewsRecorded);
    awarenessDenominators.push(totalHealthImpacts);
  }
  if (childRoomRemediation > 0) {
    awarenessNumerators.push(childInformedWorks);
    awarenessDenominators.push(childRoomRemediation);
  }
  if (childBedroomVentilationTotal > 0) {
    awarenessNumerators.push(childBedroomVentilation);
    awarenessDenominators.push(childBedroomVentilationTotal);
  }
  if (mouldFound > 0) {
    awarenessNumerators.push(reportedToManagement);
    awarenessDenominators.push(mouldFound);
  }

  const totalAwarenessNum = awarenessNumerators.reduce((a, b) => a + b, 0);
  const totalAwarenessDenom = awarenessDenominators.reduce((a, b) => a + b, 0);
  const childAwarenessRate = pct(totalAwarenessNum, totalAwarenessDenom);

  // ── Scoring: base 52 ─────────────────────────────────────────────────

  let score = 52;

  // --- Bonus 1: dampSurveyRate (>=90: +4, >=70: +2) ---
  if (dampSurveyRate >= 90) score += 4;
  else if (dampSurveyRate >= 70) score += 2;

  // --- Bonus 2: mouldInspectionRate (>=90: +4, >=70: +2) ---
  if (mouldInspectionRate >= 90) score += 4;
  else if (mouldInspectionRate >= 70) score += 2;

  // --- Bonus 3: remediationRate (>=95: +4, >=80: +2) ---
  if (remediationRate >= 95) score += 4;
  else if (remediationRate >= 80) score += 2;

  // --- Bonus 4: ventilationRate (>=90: +3, >=70: +1) ---
  if (ventilationRate >= 90) score += 3;
  else if (ventilationRate >= 70) score += 1;

  // --- Bonus 5: healthImpactRate (>=95: +3, >=80: +1) ---
  if (healthImpactRate >= 95) score += 3;
  else if (healthImpactRate >= 80) score += 1;

  // --- Bonus 6: childAwarenessRate (>=90: +3, >=70: +1) ---
  if (childAwarenessRate >= 90) score += 3;
  else if (childAwarenessRate >= 70) score += 1;

  // --- Bonus 7: actionCompletionRate (>=90: +3, >=70: +1) ---
  if (actionCompletionRate >= 90) score += 3;
  else if (actionCompletionRate >= 70) score += 1;

  // --- Bonus 8: followUpCompletionRate (>=90: +2, >=70: +1) ---
  if (followUpCompletionRate >= 90) score += 2;
  else if (followUpCompletionRate >= 70) score += 1;

  // --- Bonus 9: buildingRegsRate (>=90: +2, >=70: +1) ---
  if (buildingRegsRate >= 90) score += 2;
  else if (buildingRegsRate >= 70) score += 1;

  // ── Penalties (4 guarded) ─────────────────────────────────────────────

  // dampSurveyRate < 40 → -5 (guarded)
  if (dampSurveyRate < 40 && totalDampSurveys > 0) score -= 5;

  // remediationRate < 50 → -5 (guarded)
  if (remediationRate < 50 && totalRemediations > 0) score -= 5;

  // ventilationRate < 40 → -5 (guarded)
  if (ventilationRate < 40 && totalVentilationAssessments > 0) score -= 5;

  // childAwarenessRate < 30 → -3 (guarded)
  if (childAwarenessRate < 30 && totalAwarenessDenom > 0) score -= 3;

  score = clamp(score, 0, 100);

  const damp_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (dampSurveyRate >= 90 && totalDampSurveys > 0) {
    strengths.push(
      `${dampSurveyRate}% of damp surveys within acceptable moisture range — the home demonstrates excellent damp monitoring and moisture management across its premises.`,
    );
  } else if (dampSurveyRate >= 70 && totalDampSurveys > 0) {
    strengths.push(
      `${dampSurveyRate}% of damp surveys within acceptable range — the home is managing moisture levels effectively with consistent survey monitoring.`,
    );
  }

  if (mouldInspectionRate >= 90 && totalMouldInspections > 0) {
    strengths.push(
      `${mouldInspectionRate}% of mould inspections found no mould — the home maintains an excellent standard of premises cleanliness and mould prevention.`,
    );
  } else if (mouldInspectionRate >= 70 && totalMouldInspections > 0) {
    strengths.push(
      `${mouldInspectionRate}% of mould inspections clear — good levels of mould prevention across the home's premises.`,
    );
  }

  if (remediationRate >= 95 && totalRemediations > 0) {
    strengths.push(
      `${remediationRate}% of damp and mould remediations completed — the home demonstrates outstanding follow-through on addressing damp and mould issues.`,
    );
  } else if (remediationRate >= 80 && totalRemediations > 0) {
    strengths.push(
      `${remediationRate}% remediation completion rate — strong commitment to resolving damp and mould issues identified through surveys and inspections.`,
    );
  }

  if (ventilationRate >= 90 && totalVentilationAssessments > 0) {
    strengths.push(
      `${ventilationRate}% of ventilation assessments rated adequate — the home ensures excellent air circulation and ventilation standards across all areas.`,
    );
  } else if (ventilationRate >= 70 && totalVentilationAssessments > 0) {
    strengths.push(
      `${ventilationRate}% ventilation adequacy — good ventilation management helping to prevent condensation and mould growth.`,
    );
  }

  if (healthImpactRate >= 95 && treatmentRequiredHealth > 0) {
    strengths.push(
      `${healthImpactRate}% of children's health impacts received appropriate treatment — the home responds effectively to health concerns linked to damp and mould.`,
    );
  } else if (healthImpactRate >= 80 && treatmentRequiredHealth > 0) {
    strengths.push(
      `${healthImpactRate}% treatment provision rate for health impacts — good responsiveness to children's health concerns related to damp and mould exposure.`,
    );
  }

  if (childAwarenessRate >= 90 && totalAwarenessDenom > 0) {
    strengths.push(
      `${childAwarenessRate}% child awareness and involvement — children are well-informed about damp and mould management, with their views recorded and bedrooms adequately ventilated.`,
    );
  } else if (childAwarenessRate >= 70 && totalAwarenessDenom > 0) {
    strengths.push(
      `${childAwarenessRate}% child awareness rate — good levels of communication with children about damp and mould issues affecting their living environment.`,
    );
  }

  if (actionCompletionRate >= 90 && actionsRequired > 0) {
    strengths.push(
      `${actionCompletionRate}% of damp survey actions completed — the home consistently follows through on identified damp issues requiring attention.`,
    );
  } else if (actionCompletionRate >= 70 && actionsRequired > 0) {
    strengths.push(
      `${actionCompletionRate}% of damp survey actions actioned — the home generally addresses issues identified during damp surveys.`,
    );
  }

  if (followUpCompletionRate >= 90 && followUpsRequired > 0) {
    strengths.push(
      `${followUpCompletionRate}% of damp survey follow-ups completed — excellent tracking and completion of follow-up activities ensures issues do not deteriorate.`,
    );
  } else if (followUpCompletionRate >= 70 && followUpsRequired > 0) {
    strengths.push(
      `${followUpCompletionRate}% of follow-ups completed — good follow-up practices helping to prevent damp issues from worsening.`,
    );
  }

  if (buildingRegsRate >= 90 && totalVentilationAssessments > 0) {
    strengths.push(
      `${buildingRegsRate}% of ventilation assessments meet building regulations — the home ensures compliance with ventilation standards that protect children's health.`,
    );
  } else if (buildingRegsRate >= 70 && totalVentilationAssessments > 0) {
    strengths.push(
      `${buildingRegsRate}% of ventilation meeting building regulations — good compliance with statutory ventilation requirements.`,
    );
  }

  if (recurrenceRate === 0 && completedRemediations > 0) {
    strengths.push(
      "Zero recurrence of damp or mould following completed remediations — remediation works are effective and lasting, demonstrating quality workmanship and appropriate solutions.",
    );
  }

  if (immediateActionRate >= 90 && mouldFound > 0) {
    strengths.push(
      `${immediateActionRate}% immediate action taken when mould found — the home responds swiftly to mould discoveries, protecting children from prolonged exposure.`,
    );
  }

  if (condensationRate === 0 && totalVentilationAssessments > 0) {
    strengths.push(
      "No condensation observed across any ventilation assessments — excellent environmental control preventing conditions that lead to mould growth.",
    );
  }

  if (childBedroomVentilationRate >= 100 && childBedroomVentilationTotal > 0) {
    strengths.push(
      "All children's bedrooms assessed as having adequate ventilation — children's sleeping environments meet appropriate air quality standards.",
    );
  }

  if (resolvedRate >= 90 && totalHealthImpacts > 0) {
    strengths.push(
      `${resolvedRate}% of health impacts resolved — the home effectively addresses and resolves children's health concerns linked to damp and mould.`,
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (dampSurveyRate < 40 && totalDampSurveys > 0) {
    concerns.push(
      `Only ${dampSurveyRate}% of damp surveys within acceptable moisture range — the majority of the premises show excessive moisture levels, indicating a fundamental failure in damp management that directly risks children's health.`,
    );
  } else if (dampSurveyRate < 70 && dampSurveyRate >= 40 && totalDampSurveys > 0) {
    concerns.push(
      `Damp survey compliance at ${dampSurveyRate}% — the home is not consistently maintaining acceptable moisture levels across its premises, increasing the risk of mould growth and health impacts.`,
    );
  }

  if (mouldInspectionRate < 50 && totalMouldInspections > 0) {
    concerns.push(
      `Mould found in ${mouldDetectionRate}% of inspections — widespread mould presence indicates a significant premises safety concern requiring urgent remediation and investigation of root causes.`,
    );
  } else if (mouldInspectionRate < 70 && mouldInspectionRate >= 50 && totalMouldInspections > 0) {
    concerns.push(
      `Mould found in ${mouldDetectionRate}% of inspections — mould presence in a significant minority of inspections suggests inadequate prevention measures.`,
    );
  }

  if (remediationRate < 50 && totalRemediations > 0) {
    concerns.push(
      `Only ${remediationRate}% of remediations completed — the majority of identified damp and mould issues remain unresolved, leaving children exposed to ongoing health risks and demonstrating a failure in premises management.`,
    );
  } else if (remediationRate < 80 && remediationRate >= 50 && totalRemediations > 0) {
    concerns.push(
      `Remediation completion at ${remediationRate}% — a number of damp and mould issues remain outstanding, prolonging children's exposure to potentially harmful living conditions.`,
    );
  }

  if (ventilationRate < 40 && totalVentilationAssessments > 0) {
    concerns.push(
      `Only ${ventilationRate}% of ventilation assessments rated adequate — the majority of assessed areas have inadequate ventilation, directly contributing to condensation, damp, and mould growth that threatens children's respiratory health.`,
    );
  } else if (ventilationRate < 70 && ventilationRate >= 40 && totalVentilationAssessments > 0) {
    concerns.push(
      `Ventilation adequacy at ${ventilationRate}% — insufficient ventilation in a number of areas increases the risk of condensation and mould, potentially affecting children's health and comfort.`,
    );
  }

  if (healthImpactRate < 50 && treatmentRequiredHealth > 0) {
    concerns.push(
      `Only ${healthImpactRate}% of children's health impacts received required treatment — children's health needs linked to damp and mould exposure are not being adequately addressed.`,
    );
  } else if (healthImpactRate < 80 && healthImpactRate >= 50 && treatmentRequiredHealth > 0) {
    concerns.push(
      `Treatment provision at ${healthImpactRate}% for damp and mould related health impacts — some children are not receiving timely treatment for health conditions linked to their living environment.`,
    );
  }

  if (childAwarenessRate < 30 && totalAwarenessDenom > 0) {
    concerns.push(
      `Only ${childAwarenessRate}% child awareness across damp and mould management — children are not being informed about works affecting their rooms, their views are not recorded, and awareness of ventilation in their bedrooms is low.`,
    );
  } else if (childAwarenessRate < 70 && childAwarenessRate >= 30 && totalAwarenessDenom > 0) {
    concerns.push(
      `Child awareness at ${childAwarenessRate}% — children are not consistently informed about or involved in damp and mould management decisions that affect their living environment.`,
    );
  }

  if (childBedroomMouldRate >= 20 && totalMouldInspections > 0) {
    concerns.push(
      `Mould found in children's bedrooms in ${childBedroomMouldRate}% of inspections — children are being exposed to mould in their sleeping environment, posing a direct risk to their respiratory health.`,
    );
  }

  if (recurrenceRate >= 20 && completedRemediations > 0) {
    concerns.push(
      `${recurrenceRate}% recurrence rate following completed remediations — issues are returning after treatment, indicating underlying causes are not being adequately addressed or remediation quality is insufficient.`,
    );
  }

  if (outstandingRemediations >= 3) {
    concerns.push(
      `${outstandingRemediations} remediations remain outstanding — a backlog of unresolved damp and mould issues indicates the home is not keeping pace with premises maintenance needs.`,
    );
  }

  if (condensationRate >= 30 && totalVentilationAssessments > 0) {
    concerns.push(
      `Condensation observed in ${condensationRate}% of ventilation assessments — widespread condensation is a precursor to mould growth and indicates systemic ventilation inadequacy.`,
    );
  } else if (condensationRate >= 15 && condensationRate < 30 && totalVentilationAssessments > 0) {
    concerns.push(
      `Condensation present in ${condensationRate}% of assessments — moderate condensation levels suggest some areas require improved ventilation to prevent mould growth.`,
    );
  }

  if (schoolAbsenceRate >= 20 && totalHealthImpacts > 0) {
    concerns.push(
      `${schoolAbsenceRate}% of damp and mould health impacts have caused school absences totalling ${totalSchoolAbsenceDays} days — children's education is being disrupted by health conditions linked to their living environment.`,
    );
  }

  if (recurringRate >= 20 && totalHealthImpacts > 0) {
    concerns.push(
      `${recurringRate}% of health impacts are recurring — children continue to experience health problems linked to damp and mould, indicating the environmental cause has not been effectively resolved.`,
    );
  }

  if (immediateActionRate < 50 && mouldFound > 0) {
    concerns.push(
      `Only ${immediateActionRate}% immediate action taken when mould discovered — delayed response to mould findings exposes children to prolonged health risks.`,
    );
  }

  if (childBedroomVentilationRate < 70 && childBedroomVentilationTotal > 0) {
    concerns.push(
      `Only ${childBedroomVentilationRate}% of children's bedrooms have adequate ventilation — children are sleeping in rooms with insufficient air circulation, increasing their risk of respiratory issues.`,
    );
  }

  if (socialWorkerInformedRate < 50 && totalHealthImpacts > 0) {
    concerns.push(
      `Only ${socialWorkerInformedRate}% of health impacts reported to social workers — the home is failing to keep placing authorities informed about environmental health risks affecting children in their care.`,
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: DampMouldRecommendation[] = [];
  let rank = 0;

  if (dampSurveyRate < 40 && totalDampSurveys > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently commission a comprehensive damp survey of the entire premises by a qualified surveyor — identify all areas exceeding acceptable moisture thresholds and develop a prioritised remediation plan focusing on children's bedrooms and communal living areas first.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (remediationRate < 50 && totalRemediations > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Clear the backlog of outstanding remediations as an urgent priority — incomplete damp and mould remediation works leave children exposed to ongoing health hazards. Establish a remediation tracker with assigned owners, target dates, and escalation procedures.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (ventilationRate < 40 && totalVentilationAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Commission an urgent ventilation review of all areas with inadequate airflow — install or repair extractor fans, trickle vents, and mechanical ventilation as required. Prioritise children's bedrooms, bathrooms, and areas where condensation or mould has been identified.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (childAwarenessRate < 30 && totalAwarenessDenom > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish a protocol for involving and informing children about damp and mould issues in their living environment — record children's views when their rooms are affected, explain planned works, and ensure children understand how to report concerns about damp, mould, or ventilation.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (healthImpactRate < 50 && treatmentRequiredHealth > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review all children with untreated health impacts linked to damp and mould — ensure each child receives appropriate medical attention, that health assessments are up to date, and that the living environment is modified to reduce ongoing exposure.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Health",
    });
  }

  if (childBedroomMouldRate >= 20 && totalMouldInspections > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Immediately address mould in children's bedrooms — where mould is found in sleeping environments, treat and remove it within 24 hours, assess the child's health, and investigate root causes including ventilation, insulation, and heating adequacy.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (immediateActionRate < 50 && mouldFound > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish a rapid response protocol for mould discoveries — all mould findings must trigger immediate action including cleaning, treatment, and root cause investigation. Staff must understand the health risks and the requirement for prompt response.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (recurrenceRate >= 20 && completedRemediations > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Investigate the root causes of recurring damp and mould issues — engage specialist contractors to assess whether underlying structural, drainage, or ventilation deficiencies are causing recurrence. Address causes, not just symptoms.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (socialWorkerInformedRate < 50 && totalHealthImpacts > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all health impacts linked to damp and mould are reported to children's social workers and placing authorities — this is essential for transparency and multi-agency safeguarding of children's health and welfare.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Health",
    });
  }

  if (condensationRate >= 30 && totalVentilationAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop a condensation management plan — identify areas with persistent condensation and implement targeted solutions including improved heating schedules, dehumidifiers, insulation improvements, and ventilation upgrades to break the condensation-mould cycle.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (maintenanceCompletionRate < 50 && maintenanceRequired > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Complete outstanding ventilation maintenance — non-functional extractor fans, blocked vents, and unserviced mechanical ventilation systems directly contribute to damp and mould risk. Schedule and track all maintenance to completion.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (
    dampSurveyRate >= 40 &&
    dampSurveyRate < 70 &&
    totalDampSurveys > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase the frequency and thoroughness of damp surveys — target areas with historical moisture issues, ensure moisture readings are taken at all key points, and track trends over time to identify deterioration before it becomes severe.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (
    remediationRate >= 50 &&
    remediationRate < 80 &&
    totalRemediations > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve remediation completion rates to at least 80% — review outstanding works, identify barriers to completion, and ensure contractor arrangements support timely resolution of damp and mould issues.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (
    ventilationRate >= 40 &&
    ventilationRate < 70 &&
    totalVentilationAssessments > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve ventilation adequacy across the home — review all areas rated as inadequate, consider installing trickle vents, upgrading extractor fans, or implementing mechanical ventilation with heat recovery where appropriate.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (
    childAwarenessRate >= 30 &&
    childAwarenessRate < 70 &&
    totalAwarenessDenom > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen child involvement in damp and mould management — include children in discussions about their living environment, record their views on any issues affecting their rooms, and explain how ventilation and reporting help keep their environment healthy.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (
    followUpCompletionRate < 70 &&
    followUpsRequired > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve follow-up completion for damp surveys — scheduled follow-ups that are not completed allow damp issues to deteriorate. Implement a tracking system with automatic reminders and management oversight.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (totalDampSurveys === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Commission an initial comprehensive damp survey of the entire premises — without baseline damp surveys, the home cannot evidence that it is monitoring moisture levels to protect children's health and the fabric of the building.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (totalVentilationAssessments === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Conduct ventilation assessments across all rooms — adequate ventilation is essential for preventing condensation and mould growth. Assess each room including children's bedrooms, bathrooms, and kitchens.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (totalMouldInspections === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish a regular mould inspection schedule — routine mould inspections should cover all areas of the home, with particular attention to bathrooms, kitchens, and children's bedrooms. Record findings systematically.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: DampMouldInsight[] = [];

  // -- Critical insights --

  if (dampSurveyRate < 40 && totalDampSurveys > 0) {
    insights.push({
      text: `Only ${dampSurveyRate}% of damp surveys within acceptable range. Excessive moisture levels across the premises create conditions for mould growth that directly threatens children's respiratory health. Under Reg 25, the registered person must ensure the premises are maintained to a standard that supports children's health and safety — widespread damp fails this requirement.`,
      severity: "critical",
    });
  }

  if (mouldInspectionRate < 50 && totalMouldInspections > 0) {
    insights.push({
      text: `Mould found in ${mouldDetectionRate}% of inspections. Widespread mould contamination represents a significant premises safety concern. Mould spores cause respiratory illness, exacerbate asthma, and trigger allergic reactions — particularly dangerous for children who may already have compromised health. This requires immediate specialist intervention.`,
      severity: "critical",
    });
  }

  if (remediationRate < 50 && totalRemediations > 0) {
    insights.push({
      text: `Only ${remediationRate}% of damp and mould remediations completed. Unresolved remediation works mean children continue to live with known damp and mould hazards. The home cannot demonstrate it is taking reasonable steps to protect children's health when the majority of identified issues remain unaddressed.`,
      severity: "critical",
    });
  }

  if (ventilationRate < 40 && totalVentilationAssessments > 0) {
    insights.push({
      text: `Only ${ventilationRate}% of ventilation assessments rated adequate. Inadequate ventilation is the primary driver of condensation-related damp and mould in residential properties. Without adequate airflow, moisture from bathing, cooking, and breathing accumulates and creates conditions for mould growth — this is a systemic issue requiring investment in ventilation infrastructure.`,
      severity: "critical",
    });
  }

  if (childBedroomMouldRate >= 20 && totalMouldInspections > 0) {
    insights.push({
      text: `Mould affecting children's bedrooms in ${childBedroomMouldRate}% of inspections. Children spend extended periods in their bedrooms including sleeping with increased breathing rate — mould exposure during sleep is particularly harmful. Every child's bedroom should be mould-free as an absolute minimum standard under Reg 25.`,
      severity: "critical",
    });
  }

  if (totalDampSurveys === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No damp surveys conducted despite children on placement. Without systematic moisture monitoring, the home has no baseline understanding of damp levels across its premises. Damp can develop silently behind walls, under floors, and in roof spaces — by the time it is visible, significant damage and health risk may already exist.",
      severity: "critical",
    });
  }

  if (totalVentilationAssessments === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No ventilation assessments conducted despite children on placement. Adequate ventilation is a fundamental requirement of habitable premises. Without assessments, the home cannot evidence that rooms have sufficient airflow to prevent condensation and mould — this is a core Reg 25 requirement.",
      severity: "critical",
    });
  }

  if (severeHealthRate >= 20 && totalHealthImpacts > 0) {
    insights.push({
      text: `${severeHealthRate}% of health impacts classified as severe. Severe health impacts from damp and mould exposure indicate the home's environment is causing serious harm to children. This may require notification to Ofsted under Reg 40 as a significant event and urgent environmental remediation.`,
      severity: "critical",
    });
  }

  if (childAwarenessRate < 30 && totalAwarenessDenom > 0) {
    insights.push({
      text: `Child awareness and involvement at only ${childAwarenessRate}%. Children are not being meaningfully included in decisions about damp and mould management that affects their daily lives. Recording children's views on their living environment is essential to demonstrate child-centred care and compliance with SCCIF expectations around voice of the child.`,
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (
    dampSurveyRate >= 40 &&
    dampSurveyRate < 70 &&
    totalDampSurveys > 0
  ) {
    insights.push({
      text: `Damp survey compliance at ${dampSurveyRate}% — while some areas maintain acceptable moisture levels, inconsistency across the premises suggests pockets of damp risk. Targeted surveying of the worst-affected areas and trend analysis would help prioritise remediation.`,
      severity: "warning",
    });
  }

  if (
    mouldInspectionRate >= 50 &&
    mouldInspectionRate < 70 &&
    totalMouldInspections > 0
  ) {
    insights.push({
      text: `Mould found in ${mouldDetectionRate}% of inspections — while not widespread, recurring mould discoveries suggest underlying issues with ventilation, heating, or insulation in certain areas. Investigating root causes would be more effective than repeated surface treatment.`,
      severity: "warning",
    });
  }

  if (
    remediationRate >= 50 &&
    remediationRate < 80 &&
    totalRemediations > 0
  ) {
    insights.push({
      text: `Remediation completion at ${remediationRate}% — while most works are completed, outstanding remediations mean some damp and mould issues persist. Prioritising completion by severity and child impact would demonstrate focused risk management.`,
      severity: "warning",
    });
  }

  if (
    ventilationRate >= 40 &&
    ventilationRate < 70 &&
    totalVentilationAssessments > 0
  ) {
    insights.push({
      text: `Ventilation adequacy at ${ventilationRate}% — areas with inadequate ventilation are likely to develop condensation and mould over time. Proactive improvements now will prevent more costly remediation later and protect children's health.`,
      severity: "warning",
    });
  }

  if (
    condensationRate >= 15 &&
    condensationRate < 30 &&
    totalVentilationAssessments > 0
  ) {
    insights.push({
      text: `Condensation observed in ${condensationRate}% of assessments — moderate condensation levels are an early warning sign. Without intervention, these areas are likely to develop mould. Consider improved heating, insulation, or ventilation in affected areas.`,
      severity: "warning",
    });
  }

  // Identify most common mould locations
  const locationCounts: Record<string, number> = {};
  for (const m of mould_inspection_records.filter((r) => r.mould_found)) {
    locationCounts[m.location_type] = (locationCounts[m.location_type] ?? 0) + 1;
  }
  const topLocations = Object.entries(locationCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topLocations.length > 0 && mouldFound >= 3) {
    insights.push({
      text: `Most common mould locations: ${topLocations.map(([loc, count]) => `${loc} (${count})`).join(", ")}. Concentrated mould in specific areas suggests localised environmental issues — targeted ventilation improvements, insulation, or structural repairs in these locations would have the greatest impact.`,
      severity: "warning",
    });
  }

  // Identify most common health impact types
  const healthTypeCounts: Record<string, number> = {};
  for (const h of health_impact_records) {
    healthTypeCounts[h.health_concern_type] =
      (healthTypeCounts[h.health_concern_type] ?? 0) + 1;
  }
  const topHealthTypes = Object.entries(healthTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topHealthTypes.length > 0 && totalHealthImpacts >= 3) {
    insights.push({
      text: `Most common health impacts: ${topHealthTypes.map(([type, count]) => `${type} (${count})`).join(", ")}. Understanding the pattern of health effects helps target environmental improvements — ${topHealthTypes[0][0] === "respiratory" || topHealthTypes[0][0] === "asthma" ? "respiratory issues are strongly linked to mould spore exposure and require urgent environmental remediation" : "these health effects may be linked to mould or damp exposure and warrant further investigation"}.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (damp_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding damp and mould management — moisture levels are well-controlled, inspections find minimal mould, remediations are completed promptly, ventilation is adequate, and children's health is actively monitored and protected. This comprehensive approach to premises safety supports children's health and wellbeing.",
      severity: "positive",
    });
  }

  if (
    dampSurveyRate >= 90 &&
    actionCompletionRate >= 90 &&
    totalDampSurveys > 0 &&
    actionsRequired > 0
  ) {
    insights.push({
      text: `Excellent damp monitoring with ${dampSurveyRate}% within range and ${actionCompletionRate}% action completion — the home demonstrates a proactive, systematic approach to damp management that identifies and resolves issues before they affect children's health.`,
      severity: "positive",
    });
  }

  if (
    mouldInspectionRate >= 90 &&
    immediateActionRate >= 90 &&
    totalMouldInspections > 0 &&
    mouldFound > 0
  ) {
    insights.push({
      text: `${mouldInspectionRate}% of inspections mould-free with ${immediateActionRate}% immediate action on any mould found — the home maintains clean premises and responds swiftly to the rare mould discovery, demonstrating effective mould prevention and rapid response.`,
      severity: "positive",
    });
  }

  if (
    remediationRate >= 95 &&
    withinTargetRate >= 90 &&
    totalRemediations > 0 &&
    completedRemediations > 0
  ) {
    insights.push({
      text: `${remediationRate}% remediation completion with ${withinTargetRate}% within target timescales — the home resolves damp and mould issues quickly and thoroughly, minimising children's exposure to environmental hazards.`,
      severity: "positive",
    });
  }

  if (
    ventilationRate >= 90 &&
    condensationRate === 0 &&
    totalVentilationAssessments > 0
  ) {
    insights.push({
      text: `${ventilationRate}% ventilation adequacy with no condensation observed — excellent environmental control demonstrating that the home's ventilation systems effectively prevent the conditions that lead to damp and mould growth.`,
      severity: "positive",
    });
  }

  if (
    childAwarenessRate >= 90 &&
    totalAwarenessDenom > 0
  ) {
    insights.push({
      text: `${childAwarenessRate}% child awareness across damp and mould management — children are well-informed about their living environment, their views are recorded, and they are involved in decisions about remediation works. This demonstrates genuinely child-centred premises management.`,
      severity: "positive",
    });
  }

  if (
    resolvedRate >= 90 &&
    treatmentProvisionRate >= 90 &&
    totalHealthImpacts > 0 &&
    treatmentRequiredHealth > 0
  ) {
    insights.push({
      text: `${resolvedRate}% of health impacts resolved with ${treatmentProvisionRate}% treatment provision — the home effectively addresses children's health needs arising from environmental factors, ensuring medical treatment is provided and conditions are resolved.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (damp_rating === "outstanding") {
    headline =
      "Outstanding damp and mould management — moisture levels are well-controlled, inspections find minimal mould, remediations are completed promptly, ventilation is adequate, and children's health is actively protected.";
  } else if (damp_rating === "good") {
    headline = `Good damp and mould management — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (damp_rating === "adequate") {
    headline = `Adequate damp and mould management — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure premises safety and children's health protection.`;
  } else {
    headline = `Damp and mould management is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to address premises safety, ventilation adequacy, and children's health protection.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    damp_rating,
    damp_score: score,
    headline,
    total_damp_surveys: totalDampSurveys,
    total_mould_inspections: totalMouldInspections,
    total_remediations: totalRemediations,
    total_ventilation_assessments: totalVentilationAssessments,
    total_health_impacts: totalHealthImpacts,
    damp_survey_rate: dampSurveyRate,
    mould_inspection_rate: mouldInspectionRate,
    remediation_rate: remediationRate,
    ventilation_rate: ventilationRate,
    health_impact_rate: healthImpactRate,
    child_awareness_rate: childAwarenessRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
