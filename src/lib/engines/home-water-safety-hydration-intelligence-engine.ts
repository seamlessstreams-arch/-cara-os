// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME WATER SAFETY & HYDRATION INTELLIGENCE ENGINE
// Tracks water safety and hydration management — water temperature checks,
// legionella risk assessments, hydration monitoring, swimming competency
// assessments, and water activity safety.
// Critical for Ofsted under Children's Homes Regulations 2015
// (Reg 25 premises/safety, Reg 5 quality of care, SCCIF safety).
// Pure deterministic engine — no imports, no LLM, no external deps.
// Store keys: waterTemperatureRecords, legionellaAssessmentRecords,
//             hydrationMonitoringRecords, swimmingCompetencyRecords,
//             waterActivitySafetyRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface WaterTemperatureRecordInput {
  id: string;
  date: string;
  location: string;
  outlet_type: "hot_tap" | "bath" | "shower" | "kitchen" | "utility" | "other";
  temperature_celsius: number;
  within_safe_range: boolean;
  thermostatic_mixing_valve_fitted: boolean;
  tmv_tested: boolean;
  scald_risk_identified: boolean;
  action_taken_if_unsafe: boolean;
  checked_by: string;
  notes: string;
  created_at: string;
}

export interface LegionellaAssessmentRecordInput {
  id: string;
  date: string;
  assessment_type: "full_risk_assessment" | "monthly_flush" | "quarterly_check" | "temperature_monitoring" | "annual_review" | "remedial";
  compliant: boolean;
  assessor: string;
  dead_legs_identified: number;
  dead_legs_remediated: number;
  water_storage_temperature_compliant: boolean;
  distribution_temperature_compliant: boolean;
  flushing_regime_followed: boolean;
  written_scheme_in_place: boolean;
  next_assessment_due: string;
  overdue: boolean;
  findings: string;
  actions_required: number;
  actions_completed: number;
  notes: string;
  created_at: string;
}

export interface HydrationMonitoringRecordInput {
  id: string;
  child_id: string;
  date: string;
  fluid_intake_ml: number;
  target_intake_ml: number;
  met_target: boolean;
  hydration_concern_raised: boolean;
  concern_type: "dehydration" | "fluid_refusal" | "medical" | "behavioural" | "weather_related" | "none";
  intervention_provided: boolean;
  intervention_type: string;
  child_encouraged: boolean;
  accessible_water_available: boolean;
  staff_prompted: boolean;
  notes: string;
  created_at: string;
}

export interface SwimmingCompetencyRecordInput {
  id: string;
  child_id: string;
  date: string;
  competency_level: "non_swimmer" | "beginner" | "developing" | "competent" | "strong" | "advanced";
  assessment_conducted: boolean;
  assessor_qualified: boolean;
  water_confidence_rating: number; // 1-5
  can_swim_25m: boolean;
  water_safety_knowledge_assessed: boolean;
  water_safety_knowledge_passed: boolean;
  lessons_attended: number;
  lessons_offered: number;
  parental_consent_obtained: boolean;
  risk_assessment_completed: boolean;
  notes: string;
  created_at: string;
}

export interface WaterActivitySafetyRecordInput {
  id: string;
  date: string;
  activity_type: "swimming_pool" | "open_water" | "water_park" | "paddling" | "boating" | "fishing" | "beach" | "other";
  risk_assessment_completed: boolean;
  risk_assessment_approved: boolean;
  qualified_supervision: boolean;
  supervision_ratio_met: boolean;
  child_competencies_checked: boolean;
  safety_equipment_available: boolean;
  safety_briefing_given: boolean;
  emergency_plan_in_place: boolean;
  incident_occurred: boolean;
  incident_type: string;
  children_participated: number;
  children_total: number;
  consent_obtained_all: boolean;
  first_aider_present: boolean;
  notes: string;
  created_at: string;
}

export interface WaterSafetyInput {
  today: string;
  total_children: number;
  water_temperature_records: WaterTemperatureRecordInput[];
  legionella_assessment_records: LegionellaAssessmentRecordInput[];
  hydration_monitoring_records: HydrationMonitoringRecordInput[];
  swimming_competency_records: SwimmingCompetencyRecordInput[];
  water_activity_safety_records: WaterActivitySafetyRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type WaterSafetyRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface WaterSafetyInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface WaterSafetyRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface WaterSafetyResult {
  water_safety_rating: WaterSafetyRating;
  water_safety_score: number | null;
  headline: string;
  total_temperature_records: number;
  total_legionella_records: number;
  total_hydration_records: number;
  total_swimming_competency_records: number;
  total_water_activity_records: number;
  temperature_check_rate: number | null;
  legionella_compliance_rate: number | null;
  hydration_monitoring_rate: number | null;
  swimming_competency_rate: number | null;
  water_activity_safety_rate: number | null;
  child_awareness_rate: number | null;
  strengths: string[];
  concerns: string[];
  recommendations: WaterSafetyRecommendation[];
  insights: WaterSafetyInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): WaterSafetyRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: WaterSafetyRating,
  score: number,
  headline: string,
): WaterSafetyResult {
  return {
    water_safety_rating: rating,
    water_safety_score: score,
    headline,
    total_temperature_records: 0,
    total_legionella_records: 0,
    total_hydration_records: 0,
    total_swimming_competency_records: 0,
    total_water_activity_records: 0,
    temperature_check_rate: 0,
    legionella_compliance_rate: 0,
    hydration_monitoring_rate: 0,
    swimming_competency_rate: 0,
    water_activity_safety_rate: 0,
    child_awareness_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeWaterSafetyHydration(
  input: WaterSafetyInput,
): WaterSafetyResult {
  const {
    total_children,
    water_temperature_records,
    legionella_assessment_records,
    hydration_monitoring_records,
    swimming_competency_records,
    water_activity_safety_records,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    water_temperature_records.length === 0 &&
    legionella_assessment_records.length === 0 &&
    hydration_monitoring_records.length === 0 &&
    swimming_competency_records.length === 0 &&
    water_activity_safety_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess water safety and hydration management.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No water safety or hydration data recorded despite children on placement — water temperature checks, legionella assessments, and hydration monitoring require urgent attention.",
      ),
      concerns: [
        "No water temperature records, legionella assessments, hydration monitoring records, swimming competency assessments, or water activity safety records exist despite children being on placement — the home cannot evidence water safety compliance or hydration management.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement immediate water temperature checking regime across all outlets — hot water must be below 44°C at the point of use in areas accessible to children to prevent scalding. Install and test thermostatic mixing valves where required.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
        },
        {
          rank: 2,
          recommendation:
            "Commission a full legionella risk assessment and implement a written scheme for controlling legionella risk including regular flushing, temperature monitoring, and dead-leg remediation.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
        },
        {
          rank: 3,
          recommendation:
            "Establish hydration monitoring for all children to ensure adequate fluid intake is tracked, encouraged, and accessible water is always available.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
        },
      ],
      insights: [
        {
          text: "The complete absence of water safety records is a serious regulatory concern. Water temperature checks and legionella risk management are statutory requirements under CHR 2015 Reg 25. Failure to evidence these could result in enforcement action. Hydration monitoring is essential for children's health and wellbeing under Reg 5.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- Water temperature metrics ---
  const totalTemperatureRecords = water_temperature_records.length;
  const withinSafeRange = water_temperature_records.filter((t) => t.within_safe_range).length;
  const temperatureCheckRate = pct(withinSafeRange, totalTemperatureRecords);

  const tmvFitted = water_temperature_records.filter((t) => t.thermostatic_mixing_valve_fitted).length;
  const tmvFittedRate = pct(tmvFitted, totalTemperatureRecords);

  const tmvTested = water_temperature_records.filter((t) => t.thermostatic_mixing_valve_fitted && t.tmv_tested).length;
  const tmvTestedRate = tmvFitted > 0 ? pct(tmvTested, tmvFitted) : 0;

  const scaldRiskIdentified = water_temperature_records.filter((t) => t.scald_risk_identified).length;
  const scaldRiskRate = pct(scaldRiskIdentified, totalTemperatureRecords);

  const actionTakenWhenUnsafe = water_temperature_records.filter(
    (t) => !t.within_safe_range && t.action_taken_if_unsafe,
  ).length;
  const unsafeRecords = water_temperature_records.filter((t) => !t.within_safe_range).length;
  const actionTakenRate = pct(actionTakenWhenUnsafe, unsafeRecords);

  // --- Legionella compliance metrics ---
  const totalLegionellaRecords = legionella_assessment_records.length;
  const compliantLegionella = legionella_assessment_records.filter((l) => l.compliant).length;
  const legionellaComplianceRate = pct(compliantLegionella, totalLegionellaRecords);

  const writtenSchemeInPlace = legionella_assessment_records.filter((l) => l.written_scheme_in_place).length;
  const writtenSchemeRate = pct(writtenSchemeInPlace, totalLegionellaRecords);

  const flushingFollowed = legionella_assessment_records.filter((l) => l.flushing_regime_followed).length;
  const flushingRate = pct(flushingFollowed, totalLegionellaRecords);

  const storageCompliant = legionella_assessment_records.filter((l) => l.water_storage_temperature_compliant).length;
  const storageComplianceRate = pct(storageCompliant, totalLegionellaRecords);

  const distributionCompliant = legionella_assessment_records.filter((l) => l.distribution_temperature_compliant).length;
  const distributionComplianceRate = pct(distributionCompliant, totalLegionellaRecords);

  const overdueLegionella = legionella_assessment_records.filter((l) => l.overdue).length;
  const overdueRate = pct(overdueLegionella, totalLegionellaRecords);

  const totalActionsRequired = legionella_assessment_records.reduce((sum, l) => sum + l.actions_required, 0);
  const totalActionsCompleted = legionella_assessment_records.reduce((sum, l) => sum + l.actions_completed, 0);
  const legionellaActionCompletionRate = pct(totalActionsCompleted, totalActionsRequired);

  const totalDeadLegsIdentified = legionella_assessment_records.reduce((sum, l) => sum + l.dead_legs_identified, 0);
  const totalDeadLegsRemediated = legionella_assessment_records.reduce((sum, l) => sum + l.dead_legs_remediated, 0);
  const deadLegRemediationRate = pct(totalDeadLegsRemediated, totalDeadLegsIdentified);

  // --- Hydration monitoring metrics ---
  const totalHydrationRecords = hydration_monitoring_records.length;
  const metTarget = hydration_monitoring_records.filter((h) => h.met_target).length;
  const hydrationMonitoringRate = pct(metTarget, totalHydrationRecords);

  const hydrationConcerns = hydration_monitoring_records.filter((h) => h.hydration_concern_raised).length;
  const hydrationConcernRate = pct(hydrationConcerns, totalHydrationRecords);

  const interventionProvided = hydration_monitoring_records.filter(
    (h) => h.hydration_concern_raised && h.intervention_provided,
  ).length;
  const interventionRate = hydrationConcerns > 0 ? pct(interventionProvided, hydrationConcerns) : 0;

  const accessibleWater = hydration_monitoring_records.filter((h) => h.accessible_water_available).length;
  const accessibleWaterRate = pct(accessibleWater, totalHydrationRecords);

  const childEncouraged = hydration_monitoring_records.filter((h) => h.child_encouraged).length;
  const encouragementRate = pct(childEncouraged, totalHydrationRecords);

  const staffPrompted = hydration_monitoring_records.filter((h) => h.staff_prompted).length;
  const staffPromptRate = pct(staffPrompted, totalHydrationRecords);

  const uniqueChildrenHydration = new Set(
    hydration_monitoring_records.map((h) => h.child_id),
  ).size;
  const hydrationChildCoverage = total_children > 0 ? pct(uniqueChildrenHydration, total_children) : 0;

  // --- Swimming competency metrics ---
  const totalSwimmingRecords = swimming_competency_records.length;
  const assessmentsConducted = swimming_competency_records.filter((s) => s.assessment_conducted).length;
  const swimmingAssessmentRate = pct(assessmentsConducted, totalSwimmingRecords);

  const qualifiedAssessors = swimming_competency_records.filter(
    (s) => s.assessment_conducted && s.assessor_qualified,
  ).length;
  const qualifiedAssessorRate = assessmentsConducted > 0 ? pct(qualifiedAssessors, assessmentsConducted) : 0;

  const waterSafetyKnowledgeAssessed = swimming_competency_records.filter(
    (s) => s.water_safety_knowledge_assessed,
  ).length;
  const waterSafetyKnowledgePassed = swimming_competency_records.filter(
    (s) => s.water_safety_knowledge_assessed && s.water_safety_knowledge_passed,
  ).length;
  const waterSafetyKnowledgeRate = waterSafetyKnowledgeAssessed > 0
    ? pct(waterSafetyKnowledgePassed, waterSafetyKnowledgeAssessed)
    : null;

  const totalLessonsOffered = swimming_competency_records.reduce((sum, s) => sum + s.lessons_offered, 0);
  const totalLessonsAttended = swimming_competency_records.reduce((sum, s) => sum + s.lessons_attended, 0);
  const lessonAttendanceRate = pct(totalLessonsAttended, totalLessonsOffered);

  const consentObtained = swimming_competency_records.filter((s) => s.parental_consent_obtained).length;
  const consentRate = pct(consentObtained, totalSwimmingRecords);

  const riskAssessmentSwimming = swimming_competency_records.filter((s) => s.risk_assessment_completed).length;
  const swimmingRiskAssessmentRate = pct(riskAssessmentSwimming, totalSwimmingRecords);

  const confidenceSum = swimming_competency_records.reduce((sum, s) => sum + s.water_confidence_rating, 0);
  const avgWaterConfidence = totalSwimmingRecords > 0
    ? Math.round((confidenceSum / totalSwimmingRecords) * 100) / 100
    : null;

  const canSwim25m = swimming_competency_records.filter((s) => s.can_swim_25m).length;
  const canSwim25mRate = pct(canSwim25m, totalSwimmingRecords);

  // Composite swimming competency rate:
  // Average of assessment rate, water safety knowledge pass rate, lesson attendance rate
  const swimmingCompetencyComponents: number[] = [];
  if (totalSwimmingRecords > 0) swimmingCompetencyComponents.push(swimmingAssessmentRate);
  if (waterSafetyKnowledgeAssessed > 0) swimmingCompetencyComponents.push(waterSafetyKnowledgeRate);
  if (totalLessonsOffered > 0) swimmingCompetencyComponents.push(lessonAttendanceRate);
  const swimmingCompetencyRate = swimmingCompetencyComponents.length > 0
    ? Math.round(swimmingCompetencyComponents.reduce((a, b) => a + b, 0) / swimmingCompetencyComponents.length)
    : null;

  const uniqueChildrenSwimming = new Set(
    swimming_competency_records.map((s) => s.child_id),
  ).size;
  const swimmingChildCoverage = total_children > 0 ? pct(uniqueChildrenSwimming, total_children) : 0;

  // --- Water activity safety metrics ---
  const totalWaterActivityRecords = water_activity_safety_records.length;
  const riskAssessmentCompleted = water_activity_safety_records.filter((a) => a.risk_assessment_completed).length;
  const activityRiskAssessmentRate = pct(riskAssessmentCompleted, totalWaterActivityRecords);

  const riskAssessmentApproved = water_activity_safety_records.filter(
    (a) => a.risk_assessment_completed && a.risk_assessment_approved,
  ).length;
  const riskApprovalRate = riskAssessmentCompleted > 0 ? pct(riskAssessmentApproved, riskAssessmentCompleted) : 0;

  const qualifiedSupervision = water_activity_safety_records.filter((a) => a.qualified_supervision).length;
  const qualifiedSupervisionRate = pct(qualifiedSupervision, totalWaterActivityRecords);

  const supervisionRatioMet = water_activity_safety_records.filter((a) => a.supervision_ratio_met).length;
  const supervisionRatioRate = pct(supervisionRatioMet, totalWaterActivityRecords);

  const competenciesChecked = water_activity_safety_records.filter((a) => a.child_competencies_checked).length;
  const competencyCheckRate = pct(competenciesChecked, totalWaterActivityRecords);

  const safetyEquipmentAvailable = water_activity_safety_records.filter((a) => a.safety_equipment_available).length;
  const safetyEquipmentRate = pct(safetyEquipmentAvailable, totalWaterActivityRecords);

  const safetyBriefingGiven = water_activity_safety_records.filter((a) => a.safety_briefing_given).length;
  const safetyBriefingRate = pct(safetyBriefingGiven, totalWaterActivityRecords);

  const emergencyPlanInPlace = water_activity_safety_records.filter((a) => a.emergency_plan_in_place).length;
  const emergencyPlanRate = pct(emergencyPlanInPlace, totalWaterActivityRecords);

  const incidentsOccurred = water_activity_safety_records.filter((a) => a.incident_occurred).length;
  const incidentRate = pct(incidentsOccurred, totalWaterActivityRecords);

  const consentAllActivities = water_activity_safety_records.filter((a) => a.consent_obtained_all).length;
  const activityConsentRate = pct(consentAllActivities, totalWaterActivityRecords);

  const firstAiderPresent = water_activity_safety_records.filter((a) => a.first_aider_present).length;
  const firstAiderRate = pct(firstAiderPresent, totalWaterActivityRecords);

  // Composite water activity safety rate:
  // Average of risk assessment, qualified supervision, supervision ratio, safety equipment, safety briefing, emergency plan
  const activitySafetyComponents: number[] = [];
  if (totalWaterActivityRecords > 0) {
    activitySafetyComponents.push(activityRiskAssessmentRate);
    activitySafetyComponents.push(qualifiedSupervisionRate);
    activitySafetyComponents.push(supervisionRatioRate);
    activitySafetyComponents.push(safetyEquipmentRate);
    activitySafetyComponents.push(safetyBriefingRate);
    activitySafetyComponents.push(emergencyPlanRate);
  }
  const waterActivitySafetyRate = activitySafetyComponents.length > 0
    ? Math.round(activitySafetyComponents.reduce((a, b) => a + b, 0) / activitySafetyComponents.length)
    : null;

  // --- Child awareness composite ---
  // Composite across water safety knowledge, hydration encouragement, and activity safety briefings
  const childAwarenessNumerators: number[] = [];
  const childAwarenessDenominators: number[] = [];

  if (waterSafetyKnowledgeAssessed > 0) {
    childAwarenessNumerators.push(waterSafetyKnowledgePassed);
    childAwarenessDenominators.push(waterSafetyKnowledgeAssessed);
  }
  if (totalHydrationRecords > 0) {
    childAwarenessNumerators.push(childEncouraged);
    childAwarenessDenominators.push(totalHydrationRecords);
  }
  if (totalWaterActivityRecords > 0) {
    childAwarenessNumerators.push(safetyBriefingGiven);
    childAwarenessDenominators.push(totalWaterActivityRecords);
  }

  const totalChildAwarenessNum = childAwarenessNumerators.reduce((a, b) => a + b, 0);
  const totalChildAwarenessDenom = childAwarenessDenominators.reduce((a, b) => a + b, 0);
  const childAwarenessRate = pct(totalChildAwarenessNum, totalChildAwarenessDenom);

  // ── Scoring: base 52 ─────────────────────────────────────────────────

  let score = 52;

  // --- Bonus 1: temperatureCheckRate (>=95: +4, >=80: +2) ---
  if (temperatureCheckRate >= 95) score += 4;
  else if (temperatureCheckRate >= 80) score += 2;

  // --- Bonus 2: legionellaComplianceRate (>=95: +4, >=80: +2) ---
  if (legionellaComplianceRate >= 95) score += 4;
  else if (legionellaComplianceRate >= 80) score += 2;

  // --- Bonus 3: hydrationMonitoringRate (>=90: +3, >=70: +1) ---
  if (hydrationMonitoringRate >= 90) score += 3;
  else if (hydrationMonitoringRate >= 70) score += 1;

  // --- Bonus 4: swimmingCompetencyRate (>=90: +3, >=70: +1) ---
  if ((swimmingCompetencyRate ?? 0) >= 90) score += 3;
  else if ((swimmingCompetencyRate ?? 0) >= 70) score += 1;

  // --- Bonus 5: waterActivitySafetyRate (>=95: +4, >=80: +2) ---
  if ((waterActivitySafetyRate ?? 0) >= 95) score += 4;
  else if ((waterActivitySafetyRate ?? 0) >= 80) score += 2;

  // --- Bonus 6: childAwarenessRate (>=90: +3, >=70: +1) ---
  if (childAwarenessRate >= 90) score += 3;
  else if (childAwarenessRate >= 70) score += 1;

  // --- Bonus 7: actionTakenRate (>=95: +3, >=80: +1); all safe with records also +3 ---
  if (unsafeRecords === 0 && totalTemperatureRecords > 0) score += 3;
  else if (actionTakenRate >= 95) score += 3;
  else if (actionTakenRate >= 80) score += 1;

  // --- Bonus 8: legionellaActionCompletionRate (>=90: +2, >=70: +1) ---
  if (legionellaActionCompletionRate >= 90) score += 2;
  else if (legionellaActionCompletionRate >= 70) score += 1;

  // --- Bonus 9: accessibleWaterRate (>=95: +2, >=80: +1) ---
  if (accessibleWaterRate >= 95) score += 2;
  else if (accessibleWaterRate >= 80) score += 1;

  // ── Penalties ─────────────────────────────────────────────────────────

  // temperatureCheckRate < 50 → -5 (guarded)
  if (temperatureCheckRate < 50 && water_temperature_records.length > 0) score -= 5;

  // legionellaComplianceRate < 50 → -5 (guarded)
  if (legionellaComplianceRate < 50 && legionella_assessment_records.length > 0) score -= 5;

  // waterActivitySafetyRate < 50 → -5 (guarded)
  if ((waterActivitySafetyRate ?? 0) < 50 && water_activity_safety_records.length > 0) score -= 5;

  // hydrationMonitoringRate < 40 → -3 (guarded)
  if (hydrationMonitoringRate < 40 && hydration_monitoring_records.length > 0) score -= 3;

  score = clamp(score, 0, 100);

  const water_safety_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (temperatureCheckRate >= 95 && totalTemperatureRecords > 0) {
    strengths.push(
      `${temperatureCheckRate}% of water temperature checks within safe range — the home demonstrates excellent water temperature management, minimising scald risk to children.`,
    );
  } else if (temperatureCheckRate >= 80 && totalTemperatureRecords > 0) {
    strengths.push(
      `${temperatureCheckRate}% of water temperature checks within safe range — good water temperature management across the home.`,
    );
  }

  if (legionellaComplianceRate >= 95 && totalLegionellaRecords > 0) {
    strengths.push(
      `${legionellaComplianceRate}% legionella compliance — the home demonstrates exemplary legionella risk management with comprehensive monitoring and control measures.`,
    );
  } else if (legionellaComplianceRate >= 80 && totalLegionellaRecords > 0) {
    strengths.push(
      `${legionellaComplianceRate}% legionella compliance rate — strong legionella risk management practices are in place across the home.`,
    );
  }

  if (hydrationMonitoringRate >= 90 && totalHydrationRecords > 0) {
    strengths.push(
      `${hydrationMonitoringRate}% of hydration targets met — children's fluid intake is consistently monitored and targets are being achieved, supporting their health and wellbeing.`,
    );
  } else if (hydrationMonitoringRate >= 70 && totalHydrationRecords > 0) {
    strengths.push(
      `${hydrationMonitoringRate}% of hydration targets met — the home is generally ensuring children's fluid intake meets recommended levels.`,
    );
  }

  if ((swimmingCompetencyRate ?? 0) >= 90 && totalSwimmingRecords > 0) {
    strengths.push(
      `Swimming competency rate at ${swimmingCompetencyRate}% — children's swimming abilities are thoroughly assessed, water safety knowledge is strong, and lesson attendance is high.`,
    );
  } else if ((swimmingCompetencyRate ?? 0) >= 70 && totalSwimmingRecords > 0) {
    strengths.push(
      `Swimming competency rate at ${swimmingCompetencyRate}% — good levels of swimming assessment, water safety knowledge, and lesson attendance.`,
    );
  }

  if ((waterActivitySafetyRate ?? 0) >= 95 && totalWaterActivityRecords > 0) {
    strengths.push(
      `${waterActivitySafetyRate}% water activity safety compliance — exemplary safety management for all water-based activities with comprehensive risk assessments, qualified supervision, and safety measures.`,
    );
  } else if ((waterActivitySafetyRate ?? 0) >= 80 && totalWaterActivityRecords > 0) {
    strengths.push(
      `${waterActivitySafetyRate}% water activity safety rate — strong safety management practices for water-based activities.`,
    );
  }

  if (childAwarenessRate >= 90 && totalChildAwarenessDenom > 0) {
    strengths.push(
      `${childAwarenessRate}% child water safety awareness — children demonstrate strong water safety knowledge and are well-briefed before water activities.`,
    );
  } else if (childAwarenessRate >= 70 && totalChildAwarenessDenom > 0) {
    strengths.push(
      `${childAwarenessRate}% child water safety awareness — good levels of water safety education and briefing across activities.`,
    );
  }

  if (actionTakenRate >= 95 && unsafeRecords > 0) {
    strengths.push(
      `${actionTakenRate}% of unsafe water temperatures acted upon immediately — the home responds promptly and effectively to water safety risks.`,
    );
  } else if (actionTakenRate >= 80 && unsafeRecords > 0) {
    strengths.push(
      `${actionTakenRate}% of unsafe water temperatures addressed with corrective action — good responsive practice when water safety issues are identified.`,
    );
  }

  if (accessibleWaterRate >= 95 && totalHydrationRecords > 0) {
    strengths.push(
      `Accessible drinking water available in ${accessibleWaterRate}% of monitoring checks — children have consistent access to fresh drinking water throughout the day.`,
    );
  } else if (accessibleWaterRate >= 80 && totalHydrationRecords > 0) {
    strengths.push(
      `Accessible drinking water available in ${accessibleWaterRate}% of checks — the home generally ensures children have access to fresh water.`,
    );
  }

  if (tmvFittedRate >= 90 && totalTemperatureRecords > 0) {
    strengths.push(
      `Thermostatic mixing valves fitted at ${tmvFittedRate}% of monitored outlets — comprehensive scald prevention measures are in place.`,
    );
  }

  if (tmvTestedRate >= 95 && tmvFitted > 0) {
    strengths.push(
      `${tmvTestedRate}% of installed TMVs have been tested — thermostatic mixing valves are maintained and verified as functioning correctly.`,
    );
  }

  if (writtenSchemeRate >= 95 && totalLegionellaRecords > 0) {
    strengths.push(
      "Written legionella control scheme in place for virtually all assessments — the home has a robust documented approach to legionella risk management.",
    );
  }

  if (flushingRate >= 95 && totalLegionellaRecords > 0) {
    strengths.push(
      `${flushingRate}% flushing regime compliance — the home's water flushing programme is consistently followed, minimising legionella risk from stagnant water.`,
    );
  }

  if (hydrationChildCoverage >= 100 && total_children > 0) {
    strengths.push(
      "Every child has hydration monitoring records — fluid intake tracking is embedded in the home's approach to health and wellbeing for all children.",
    );
  } else if (hydrationChildCoverage >= 80 && total_children > 0) {
    strengths.push(
      `${hydrationChildCoverage}% of children have hydration monitoring — strong coverage ensuring most children's fluid intake is tracked and supported.`,
    );
  }

  if (interventionRate >= 95 && hydrationConcerns > 0) {
    strengths.push(
      `${interventionRate}% of hydration concerns received intervention — the home responds effectively when children's fluid intake raises concerns.`,
    );
  }

  if (swimmingChildCoverage >= 100 && total_children > 0 && totalSwimmingRecords > 0) {
    strengths.push(
      "Every child has a swimming competency assessment — the home ensures all children's water abilities are known and documented for safe activity planning.",
    );
  } else if (swimmingChildCoverage >= 80 && total_children > 0 && totalSwimmingRecords > 0) {
    strengths.push(
      `${swimmingChildCoverage}% of children have swimming competency assessments — good coverage supporting safe water activity planning.`,
    );
  }

  if (incidentRate === 0 && totalWaterActivityRecords > 0) {
    strengths.push(
      "Zero incidents recorded during water activities — effective safety planning and supervision are keeping children safe during water-based activities.",
    );
  }

  if (firstAiderRate >= 95 && totalWaterActivityRecords > 0) {
    strengths.push(
      `First aider present at ${firstAiderRate}% of water activities — the home ensures appropriate first aid cover for all water-based activities.`,
    );
  }

  if (scaldRiskRate === 0 && totalTemperatureRecords > 0) {
    strengths.push(
      "No scald risks identified across all temperature checks — the home's water temperature controls are effectively preventing scald hazards.",
    );
  }

  if (legionellaActionCompletionRate >= 95 && totalActionsRequired > 0) {
    strengths.push(
      `${legionellaActionCompletionRate}% of legionella remedial actions completed — the home follows through on all identified legionella control actions.`,
    );
  }

  if (deadLegRemediationRate >= 95 && totalDeadLegsIdentified > 0) {
    strengths.push(
      `${deadLegRemediationRate}% of dead legs remediated — the home has addressed virtually all stagnant water risks identified in legionella assessments.`,
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (temperatureCheckRate < 50 && totalTemperatureRecords > 0) {
    concerns.push(
      `Only ${temperatureCheckRate}% of water temperature checks within safe range — the majority of outlets are delivering water at unsafe temperatures, creating a serious scald risk for children.`,
    );
  } else if (temperatureCheckRate < 80 && temperatureCheckRate >= 50 && totalTemperatureRecords > 0) {
    concerns.push(
      `Water temperature compliance at ${temperatureCheckRate}% — not all water outlets are consistently within safe range, presenting an ongoing scald risk that requires attention.`,
    );
  }

  if (legionellaComplianceRate < 50 && totalLegionellaRecords > 0) {
    concerns.push(
      `Only ${legionellaComplianceRate}% legionella compliance — the majority of legionella assessments show non-compliance, indicating a fundamental failure in waterborne disease risk management.`,
    );
  } else if (legionellaComplianceRate < 80 && legionellaComplianceRate >= 50 && totalLegionellaRecords > 0) {
    concerns.push(
      `Legionella compliance at ${legionellaComplianceRate}% — inconsistent compliance with legionella risk management requirements needs urgent improvement.`,
    );
  }

  if ((waterActivitySafetyRate ?? 0) < 50 && totalWaterActivityRecords > 0) {
    concerns.push(
      `Only ${waterActivitySafetyRate}% water activity safety compliance — the majority of water activities lack adequate safety measures, creating unacceptable risk for children.`,
    );
  } else if ((waterActivitySafetyRate ?? 0) < 80 && (waterActivitySafetyRate ?? 0) >= 50 && totalWaterActivityRecords > 0) {
    concerns.push(
      `Water activity safety at ${waterActivitySafetyRate}% — not all water-based activities meet required safety standards for risk assessment, supervision, and safety equipment.`,
    );
  }

  if (hydrationMonitoringRate < 40 && totalHydrationRecords > 0) {
    concerns.push(
      `Only ${hydrationMonitoringRate}% of hydration targets met — the majority of children are not meeting recommended fluid intake levels, posing a health risk.`,
    );
  } else if (hydrationMonitoringRate < 70 && hydrationMonitoringRate >= 40 && totalHydrationRecords > 0) {
    concerns.push(
      `Hydration target achievement at ${hydrationMonitoringRate}% — not all children are consistently meeting fluid intake targets, requiring improved monitoring and encouragement.`,
    );
  }

  if (scaldRiskRate >= 20 && totalTemperatureRecords > 0) {
    concerns.push(
      `Scald risk identified in ${scaldRiskRate}% of temperature checks — multiple outlets present scald hazards to children requiring immediate remediation.`,
    );
  } else if (scaldRiskRate >= 10 && scaldRiskRate < 20 && totalTemperatureRecords > 0) {
    concerns.push(
      `Scald risk identified in ${scaldRiskRate}% of temperature checks — some water outlets present scald hazards that need to be addressed.`,
    );
  }

  if (actionTakenRate < 80 && unsafeRecords > 0) {
    concerns.push(
      `Only ${actionTakenRate}% of unsafe water temperatures had corrective action taken — failure to respond to identified water safety risks demonstrates inadequate safeguarding.`,
    );
  }

  if (overdueRate >= 30 && totalLegionellaRecords > 0) {
    concerns.push(
      `${overdueRate}% of legionella assessments are overdue — failure to maintain the assessment schedule increases the risk of legionella bacteria developing in the water system.`,
    );
  } else if (overdueRate >= 15 && overdueRate < 30 && totalLegionellaRecords > 0) {
    concerns.push(
      `${overdueRate}% of legionella assessments overdue — some assessments are not being completed on schedule, weakening the legionella control regime.`,
    );
  }

  if (flushingRate < 70 && totalLegionellaRecords > 0) {
    concerns.push(
      `Flushing regime followed in only ${flushingRate}% of assessments — inconsistent flushing allows water to stagnate, increasing legionella risk.`,
    );
  }

  if (accessibleWaterRate < 70 && totalHydrationRecords > 0) {
    concerns.push(
      `Accessible drinking water available in only ${accessibleWaterRate}% of monitoring checks — children must have constant access to fresh drinking water.`,
    );
  }

  if (hydrationConcernRate >= 30 && totalHydrationRecords > 0) {
    concerns.push(
      `Hydration concerns raised in ${hydrationConcernRate}% of monitoring records — a high proportion of children are showing signs of inadequate fluid intake.`,
    );
  } else if (hydrationConcernRate >= 15 && hydrationConcernRate < 30 && totalHydrationRecords > 0) {
    concerns.push(
      `Hydration concerns raised in ${hydrationConcernRate}% of records — a notable number of children are experiencing hydration difficulties.`,
    );
  }

  if (hydrationChildCoverage < 50 && total_children > 0 && totalHydrationRecords > 0) {
    concerns.push(
      `Only ${hydrationChildCoverage}% of children have hydration monitoring records — many children's fluid intake is not being tracked.`,
    );
  }

  if (qualifiedSupervisionRate < 70 && totalWaterActivityRecords > 0) {
    concerns.push(
      `Qualified supervision present at only ${qualifiedSupervisionRate}% of water activities — children may be participating in water activities without appropriately qualified supervisors.`,
    );
  }

  if (competencyCheckRate < 70 && totalWaterActivityRecords > 0) {
    concerns.push(
      `Child competencies checked before only ${competencyCheckRate}% of water activities — children's swimming abilities must be verified before participating in water activities.`,
    );
  }

  if (incidentRate >= 20 && totalWaterActivityRecords > 0) {
    concerns.push(
      `Incidents occurred during ${incidentRate}% of water activities — a high incident rate suggests safety planning and supervision need urgent review.`,
    );
  } else if (incidentRate >= 10 && incidentRate < 20 && totalWaterActivityRecords > 0) {
    concerns.push(
      `Incidents occurred during ${incidentRate}% of water activities — the incident rate warrants review of safety measures and supervision arrangements.`,
    );
  }

  if (swimmingChildCoverage < 50 && total_children > 0 && totalSwimmingRecords > 0) {
    concerns.push(
      `Only ${swimmingChildCoverage}% of children have swimming competency assessments — the home cannot safely plan water activities without knowing all children's abilities.`,
    );
  }

  if (legionellaActionCompletionRate < 50 && totalActionsRequired > 0) {
    concerns.push(
      `Only ${legionellaActionCompletionRate}% of legionella remedial actions completed — outstanding actions increase the risk of legionella contamination in the water system.`,
    );
  }

  if (tmvTestedRate < 70 && tmvFitted > 0) {
    concerns.push(
      `Only ${tmvTestedRate}% of installed TMVs have been tested — untested thermostatic mixing valves may not be functioning correctly, leaving children at scald risk.`,
    );
  }

  if (totalTemperatureRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No water temperature records despite children being on placement — water temperature monitoring is a statutory requirement under CHR 2015 Reg 25 to prevent scalding injuries.",
    );
  }

  if (totalLegionellaRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No legionella assessment records despite children being on placement — legionella risk assessment and control is a legal requirement to protect children and staff from waterborne disease.",
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: WaterSafetyRecommendation[] = [];
  let rank = 0;

  if (temperatureCheckRate < 50 && totalTemperatureRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review all water outlets — temperatures must be below 44°C at the point of use in areas accessible to children. Install or repair thermostatic mixing valves immediately and retest all outlets within 48 hours.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  if (legionellaComplianceRate < 50 && totalLegionellaRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Commission an urgent legionella risk assessment and remediation programme — implement a compliant written scheme including regular flushing, temperature monitoring at storage and distribution points, and dead-leg remediation.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  if ((waterActivitySafetyRate ?? 0) < 50 && totalWaterActivityRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Suspend water activities until comprehensive safety protocols are implemented — every water activity must have a completed and approved risk assessment, qualified supervision, appropriate child-to-staff ratios, safety equipment, and an emergency plan before proceeding.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  if (actionTakenRate < 80 && unsafeRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a mandatory escalation protocol for unsafe water temperatures — every out-of-range reading must trigger immediate action including restricting access, notifying management, and scheduling urgent repair. No unsafe temperature should go unaddressed.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  if (scaldRiskRate >= 20 && totalTemperatureRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Address all identified scald risks immediately — install or replace thermostatic mixing valves at affected outlets, restrict access until remediation is complete, and conduct a full review of the hot water system to prevent recurrence.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  if (hydrationMonitoringRate < 40 && totalHydrationRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review and strengthen hydration monitoring — ensure all children have accessible drinking water at all times, staff are actively encouraging fluid intake, and hydration records are accurately maintained with interventions for children not meeting targets.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (overdueRate >= 30 && totalLegionellaRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Complete all overdue legionella assessments immediately and implement a calendar-based tracking system with automated reminders to ensure future assessments are never missed.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  if (accessibleWaterRate < 70 && totalHydrationRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure fresh drinking water is accessible to all children at all times — install water dispensers in communal areas, provide individual water bottles, and train staff to regularly replenish and offer water throughout the day.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (qualifiedSupervisionRate < 70 && totalWaterActivityRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all water activities are supervised by appropriately qualified personnel — identify qualification requirements for each activity type and verify supervisor credentials before activities proceed.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Safety",
    });
  }

  if (totalTemperatureRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish an immediate water temperature checking programme — all outlets accessible to children must be tested and recorded, with thermostatic mixing valves installed where temperatures exceed safe limits.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  if (totalLegionellaRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Commission a full legionella risk assessment immediately — this is a legal requirement. Implement a written control scheme including flushing regime, temperature monitoring, and regular review.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  if (flushingRate < 70 && totalLegionellaRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve compliance with the water flushing regime — ensure all low-use outlets are flushed weekly, document flushing activity, and assign named staff responsibility for maintaining the flushing schedule.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  if (legionellaActionCompletionRate < 50 && totalActionsRequired > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Complete all outstanding legionella remedial actions — assign owners, set deadlines, and track completion. Outstanding actions represent ongoing waterborne disease risk.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  if (temperatureCheckRate >= 50 && temperatureCheckRate < 80 && totalTemperatureRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve water temperature compliance to at least 80% — identify outlets consistently outside safe range, review TMV installation and maintenance, and increase monitoring frequency for problem areas.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  if (legionellaComplianceRate >= 50 && legionellaComplianceRate < 80 && totalLegionellaRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen legionella compliance to at least 80% — review the written scheme, ensure all monitoring activities are completed on schedule, and address any recurring non-compliance issues.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  if (hydrationMonitoringRate >= 40 && hydrationMonitoringRate < 70 && totalHydrationRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase hydration target achievement — review individual children's fluid intake patterns, consider whether targets are appropriate, and implement creative strategies to encourage drinking such as flavoured water, regular reminders, and modelling by staff.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if ((waterActivitySafetyRate ?? 0) >= 50 && (waterActivitySafetyRate ?? 0) < 80 && totalWaterActivityRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen water activity safety protocols — ensure every activity has a risk assessment, qualified supervision, safety equipment, safety briefing, and emergency plan. Review any gaps and create standardised checklists for each activity type.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Safety",
    });
  }

  if (competencyCheckRate < 70 && totalWaterActivityRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement mandatory competency verification before all water activities — create a system to cross-reference children's swimming competency records with planned activities so that no child enters water without their ability being known.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Safety",
    });
  }

  if (hydrationChildCoverage < 80 && hydrationChildCoverage >= 50 && total_children > 0 && totalHydrationRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Extend hydration monitoring to cover all children — identify children without monitoring records and establish regular fluid intake tracking as part of daily care routines.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (swimmingChildCoverage < 80 && swimmingChildCoverage >= 50 && total_children > 0 && totalSwimmingRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all children receive swimming competency assessments — schedule assessments for children without records and update existing assessments annually or after significant progress.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Safety",
    });
  }

  if (childAwarenessRate >= 50 && childAwarenessRate < 70 && totalChildAwarenessDenom > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Enhance children's water safety education — develop age-appropriate water safety sessions covering dangers of open water, how to stay safe in and around water, and the importance of hydration.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (incidentRate >= 10 && totalWaterActivityRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review all water activity incidents to identify patterns and root causes — update risk assessments, supervision arrangements, and safety equipment based on lessons learned from incidents.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Safety",
    });
  }

  if (tmvTestedRate < 70 && tmvFitted > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Schedule testing of all installed thermostatic mixing valves — untested TMVs may fail silently, allowing dangerously hot water to reach children. Implement an annual TMV testing programme.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: WaterSafetyInsight[] = [];

  // -- Critical insights --

  if (temperatureCheckRate < 50 && totalTemperatureRecords > 0) {
    insights.push({
      text: `Only ${temperatureCheckRate}% of water temperature checks within safe range. This is a serious safeguarding concern — hot water above 44°C can scald a child within seconds. Under CHR 2015 Reg 25 the registered person must ensure the premises are safe. Ofsted would view persistent unsafe water temperatures as a significant failure in premises safety.`,
      severity: "critical",
    });
  }

  if (legionellaComplianceRate < 50 && totalLegionellaRecords > 0) {
    insights.push({
      text: `Only ${legionellaComplianceRate}% legionella compliance. Legionella bacteria can cause potentially fatal Legionnaires' disease. The Approved Code of Practice L8 requires all premises with water systems to have a written scheme for controlling legionella risk. Non-compliance is a significant health and safety failure that Ofsted would view as inadequate.`,
      severity: "critical",
    });
  }

  if ((waterActivitySafetyRate ?? 0) < 50 && totalWaterActivityRecords > 0) {
    insights.push({
      text: `Only ${waterActivitySafetyRate}% water activity safety compliance. Water activities present the highest risk of serious harm or death for children in care. Every water activity must have comprehensive safety measures including qualified supervision, risk assessment, safety equipment, and an emergency plan. Failure to evidence these puts children's lives at risk.`,
      severity: "critical",
    });
  }

  if (actionTakenRate < 80 && unsafeRecords > 0) {
    insights.push({
      text: `Only ${actionTakenRate}% of unsafe water temperatures had corrective action taken. Identifying a hazard but failing to act on it is worse than not identifying it — it demonstrates awareness of risk without appropriate response. This would be viewed very seriously by Ofsted as a failure in safeguarding practice.`,
      severity: "critical",
    });
  }

  if (totalTemperatureRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No water temperature monitoring records exist despite children being on placement. Water temperature checking is a fundamental premises safety requirement under CHR 2015 Reg 25. The absence of any records means the home cannot demonstrate it is protecting children from scald injuries.",
      severity: "critical",
    });
  }

  if (totalLegionellaRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No legionella assessment records exist despite children being on placement. Legionella risk assessment is a statutory requirement. The home is operating without evidence of waterborne disease risk management — this would be a significant finding in any Ofsted inspection.",
      severity: "critical",
    });
  }

  if (hydrationMonitoringRate < 40 && totalHydrationRecords > 0) {
    insights.push({
      text: `Only ${hydrationMonitoringRate}% of hydration targets met. Adequate fluid intake is essential for children's health, concentration, and wellbeing. Persistent dehydration can cause headaches, fatigue, and urinary tract infections. Under Reg 5 the home must provide care that meets children's health needs — poor hydration monitoring undermines this.`,
      severity: "critical",
    });
  }

  if (scaldRiskRate >= 20 && totalTemperatureRecords > 0) {
    insights.push({
      text: `Scald risk identified in ${scaldRiskRate}% of temperature checks. Children's skin is thinner and more vulnerable to burns than adults'. Water at 60°C can cause a full-thickness burn in one second. The frequency of scald risk findings suggests systemic failure in the hot water system rather than isolated incidents.`,
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (temperatureCheckRate >= 50 && temperatureCheckRate < 80 && totalTemperatureRecords > 0) {
    insights.push({
      text: `Water temperature compliance at ${temperatureCheckRate}% — improving but the home still has outlets delivering water outside safe range. Continued monitoring and TMV maintenance should bring this towards full compliance.`,
      severity: "warning",
    });
  }

  if (legionellaComplianceRate >= 50 && legionellaComplianceRate < 80 && totalLegionellaRecords > 0) {
    insights.push({
      text: `Legionella compliance at ${legionellaComplianceRate}% — while improving, inconsistent compliance weakens the overall legionella control regime. Gaps in flushing, monitoring, or assessment scheduling can allow bacteria to proliferate.`,
      severity: "warning",
    });
  }

  if ((waterActivitySafetyRate ?? 0) >= 50 && (waterActivitySafetyRate ?? 0) < 80 && totalWaterActivityRecords > 0) {
    insights.push({
      text: `Water activity safety at ${waterActivitySafetyRate}% — some safety measures are in place but gaps exist. Given the potentially fatal consequences of water activity incidents, every safety requirement must be met for every activity without exception.`,
      severity: "warning",
    });
  }

  if (hydrationMonitoringRate >= 40 && hydrationMonitoringRate < 70 && totalHydrationRecords > 0) {
    insights.push({
      text: `Hydration target achievement at ${hydrationMonitoringRate}% — not all children are consistently meeting fluid intake targets. Consider whether targets are realistic, whether children have preferences that could be accommodated, and whether staff are actively encouraging fluid intake throughout the day.`,
      severity: "warning",
    });
  }

  if (overdueRate >= 15 && overdueRate < 30 && totalLegionellaRecords > 0) {
    insights.push({
      text: `${overdueRate}% of legionella assessments are overdue — while not yet critical, any lapse in the assessment schedule weakens legionella control. Consider implementing automated reminders and named responsibility for scheduling.`,
      severity: "warning",
    });
  }

  if (hydrationConcernRate >= 15 && hydrationConcernRate < 30 && totalHydrationRecords > 0) {
    insights.push({
      text: `Hydration concerns raised in ${hydrationConcernRate}% of records — a notable proportion of children are experiencing difficulties with fluid intake. Review whether concerns relate to specific children, times, or contexts to target interventions effectively.`,
      severity: "warning",
    });
  }

  if ((swimmingCompetencyRate ?? 0) >= 50 && (swimmingCompetencyRate ?? 0) < 70 && totalSwimmingRecords > 0) {
    insights.push({
      text: `Swimming competency rate at ${swimmingCompetencyRate}% — assessment coverage, water safety knowledge, and lesson attendance need strengthening to ensure children are adequately prepared for water activities.`,
      severity: "warning",
    });
  }

  if (childAwarenessRate >= 50 && childAwarenessRate < 70 && totalChildAwarenessDenom > 0) {
    insights.push({
      text: `Child water safety awareness at ${childAwarenessRate}% — while some children are well-informed about water safety, broader awareness across water safety knowledge, hydration understanding, and activity safety briefings would strengthen the overall safety culture.`,
      severity: "warning",
    });
  }

  if (incidentRate >= 10 && incidentRate < 20 && totalWaterActivityRecords > 0) {
    insights.push({
      text: `Incidents occurred during ${incidentRate}% of water activities — while each incident should be reviewed on its own merits, this rate warrants a systematic review of safety measures, supervision arrangements, and activity selection to identify patterns.`,
      severity: "warning",
    });
  }

  if (encouragementRate < 70 && totalHydrationRecords > 0) {
    insights.push({
      text: `Children encouraged to drink in only ${encouragementRate}% of hydration monitoring records — many children will not independently maintain adequate fluid intake. Active, regular encouragement from staff is essential for good hydration.`,
      severity: "warning",
    });
  }

  if (legionellaActionCompletionRate >= 50 && legionellaActionCompletionRate < 70 && totalActionsRequired > 0) {
    insights.push({
      text: `Legionella remedial action completion at ${legionellaActionCompletionRate}% — some identified actions are not being followed through. Outstanding remedial actions represent ongoing risk and should be tracked to completion.`,
      severity: "warning",
    });
  }

  if (consentRate < 80 && totalSwimmingRecords > 0) {
    insights.push({
      text: `Parental consent obtained for only ${consentRate}% of swimming competency records — swimming assessments and lessons should not proceed without documented parental consent. Review consent processes for water-related activities.`,
      severity: "warning",
    });
  }

  // Identify missing outlet types in temperature checks
  const outletTypes = new Set(water_temperature_records.map((t) => t.outlet_type));
  const expectedOutlets = ["hot_tap", "bath", "shower"];
  const missingOutlets = expectedOutlets.filter((o) => !outletTypes.has(o as any));
  if (missingOutlets.length > 0 && totalTemperatureRecords > 0) {
    insights.push({
      text: `No temperature checks recorded for ${missingOutlets.join(", ")} outlet${missingOutlets.length !== 1 ? "s" : ""} — water temperature monitoring should cover all outlet types accessible to children to ensure comprehensive scald risk management.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (water_safety_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding water safety and hydration management — water temperatures are consistently safe, legionella risk is well-controlled, children are properly hydrated, swimming competencies are assessed, and water activities are managed with comprehensive safety measures. This evidences excellent compliance with CHR 2015 Reg 25 and Reg 5.",
      severity: "positive",
    });
  }

  if (temperatureCheckRate >= 95 && tmvFittedRate >= 90 && totalTemperatureRecords > 0) {
    insights.push({
      text: `${temperatureCheckRate}% water temperature compliance with TMVs fitted at ${tmvFittedRate}% of outlets — the home has a comprehensive scald prevention system that combines engineering controls with regular monitoring. This is exemplary premises safety practice.`,
      severity: "positive",
    });
  }

  if (legionellaComplianceRate >= 95 && writtenSchemeRate >= 95 && flushingRate >= 95 && totalLegionellaRecords > 0) {
    insights.push({
      text: `${legionellaComplianceRate}% legionella compliance with written scheme and flushing regime consistently maintained — the home demonstrates a mature, well-documented approach to legionella risk management that would withstand regulatory scrutiny.`,
      severity: "positive",
    });
  }

  if (hydrationMonitoringRate >= 90 && accessibleWaterRate >= 95 && totalHydrationRecords > 0) {
    insights.push({
      text: `${hydrationMonitoringRate}% of hydration targets met with ${accessibleWaterRate}% accessible water availability — the home ensures children are well-hydrated with consistent access to fresh drinking water and effective monitoring of fluid intake.`,
      severity: "positive",
    });
  }

  if ((waterActivitySafetyRate ?? 0) >= 95 && incidentRate === 0 && totalWaterActivityRecords > 0) {
    insights.push({
      text: `${waterActivitySafetyRate}% water activity safety compliance with zero incidents — comprehensive safety planning and supervision are enabling children to enjoy water activities safely. This demonstrates that rigorous safety measures allow enriching experiences without compromising child safety.`,
      severity: "positive",
    });
  }

  if (childAwarenessRate >= 90 && totalChildAwarenessDenom > 0) {
    insights.push({
      text: `${childAwarenessRate}% child water safety awareness — children demonstrate strong understanding of water safety, are well-briefed before activities, and are encouraged to maintain hydration. This equips them with life-saving knowledge and healthy habits.`,
      severity: "positive",
    });
  }

  if ((swimmingCompetencyRate ?? 0) >= 90 && swimmingChildCoverage >= 100 && total_children > 0 && totalSwimmingRecords > 0) {
    insights.push({
      text: `Swimming competency fully assessed for all children with a ${swimmingCompetencyRate}% competency rate — every child's swimming ability is known, water safety knowledge is strong, and lesson attendance is high. This enables safe and informed planning of water activities.`,
      severity: "positive",
    });
  }

  if (interventionRate >= 95 && hydrationConcerns > 0) {
    insights.push({
      text: `${interventionRate}% of hydration concerns received intervention — the home responds effectively and consistently when children's fluid intake raises concerns, demonstrating proactive health management.`,
      severity: "positive",
    });
  }

  if (scaldRiskRate === 0 && actionTakenRate >= 95 && totalTemperatureRecords > 0 && unsafeRecords > 0) {
    insights.push({
      text: `No scald risks identified and ${actionTakenRate}% of any temperature exceedances are immediately addressed — the combination of effective prevention and responsive action creates a robust water temperature safety system.`,
      severity: "positive",
    });
  }

  if (deadLegRemediationRate >= 95 && totalDeadLegsIdentified > 0 && legionellaActionCompletionRate >= 95 && totalActionsRequired > 0) {
    insights.push({
      text: `${deadLegRemediationRate}% of dead legs remediated and ${legionellaActionCompletionRate}% of all legionella actions completed — the home demonstrates excellent follow-through on legionella risk management, addressing both structural and procedural risks.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (water_safety_rating === "outstanding") {
    headline =
      "Outstanding water safety and hydration management — water temperatures are safe, legionella risk is well-controlled, children are properly hydrated, and water activities are managed with comprehensive safety measures.";
  } else if (water_safety_rating === "good") {
    headline = `Good water safety and hydration management — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (water_safety_rating === "adequate") {
    headline = `Adequate water safety and hydration management — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure effective water safety compliance and hydration monitoring.`;
  } else {
    headline = `Water safety and hydration management is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure safe water temperatures, legionella compliance, and children's hydration.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    water_safety_rating,
    water_safety_score: score,
    headline,
    total_temperature_records: totalTemperatureRecords,
    total_legionella_records: totalLegionellaRecords,
    total_hydration_records: totalHydrationRecords,
    total_swimming_competency_records: totalSwimmingRecords,
    total_water_activity_records: totalWaterActivityRecords,
    temperature_check_rate: temperatureCheckRate,
    legionella_compliance_rate: legionellaComplianceRate,
    hydration_monitoring_rate: hydrationMonitoringRate,
    swimming_competency_rate: swimmingCompetencyRate,
    water_activity_safety_rate: waterActivitySafetyRate,
    child_awareness_rate: childAwarenessRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
