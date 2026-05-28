// ==============================================================================
// CORNERSTONE -- HOME RECORD KEEPING & DOCUMENTATION QUALITY INTELLIGENCE ENGINE
// Tracks the quality, completeness, and timeliness of care records -- daily logs,
// care plans, risk assessments, incident reports, and regulatory documentation.
// Critical for Ofsted under Children's Homes Regulations 2015 (Reg 36 review of
// quality of care, Reg 37-43 records/notifications, SCCIF leadership and management).
// HOME-LEVEL engine -- no childId parameter, aggregates across all children.
// Pure deterministic engine -- no imports, no LLM, no external deps.
// CHR 2015 Reg 36 (Review of quality of care), Reg 37 (Notifiable events),
// Reg 38 (Employment of staff), Reg 39 (Staffing policy), Reg 40 (Fitness of workers).
// SCCIF: Leadership and management -- "Leaders and managers demonstrate a good
// understanding of their responsibilities...including the maintenance of records."
// Store keys: dailyLogRecords, carePlanRecords, riskAssessmentRecords,
//             incidentReportRecords, regulatoryDocumentRecords
// ==============================================================================

// -- Input Types ---------------------------------------------------------------

export interface DailyLogInput {
  id: string;
  child_id: string;
  log_date: string;
  author_name: string;
  entry_type: "routine" | "significant_event" | "observation" | "handover" | "night_check" | "welfare_check";
  word_count: number;
  completed_on_time: boolean;
  covers_wellbeing: boolean;
  covers_activities: boolean;
  covers_mood: boolean;
  covers_interactions: boolean;
  covers_meals: boolean;
  manager_reviewed: boolean;
  review_date: string | null;
  amendments_made: boolean;
  factual_and_objective: boolean;
  signed_by_author: boolean;
  created_at: string;
}

export interface CarePlanInput {
  id: string;
  child_id: string;
  plan_type: "placement" | "health" | "education" | "behaviour" | "risk" | "missing" | "independence" | "communication" | "contact";
  created_date: string;
  last_reviewed_date: string | null;
  review_due_date: string | null;
  review_overdue: boolean;
  is_current: boolean;
  objectives_count: number;
  objectives_met: number;
  child_participated: boolean;
  child_signed: boolean;
  parent_carer_consulted: boolean;
  social_worker_consulted: boolean;
  professional_input: boolean;
  plan_quality_rating: number; // 1-5
  created_at: string;
}

export interface RiskAssessmentInput {
  id: string;
  child_id: string;
  assessment_type: "individual" | "environmental" | "activity" | "contextual" | "online_safety" | "self_harm" | "missing" | "exploitation";
  assessment_date: string;
  assessed_by: string;
  risk_level: "low" | "medium" | "high" | "very_high";
  review_date: string | null;
  review_overdue: boolean;
  is_current: boolean;
  mitigations_identified: number;
  mitigations_implemented: number;
  child_involved: boolean;
  multi_agency_input: boolean;
  dynamic_risk_factors_recorded: boolean;
  linked_to_care_plan: boolean;
  created_at: string;
}

export interface IncidentReportInput {
  id: string;
  child_id: string;
  incident_date: string;
  incident_type: "behaviour" | "injury" | "safeguarding" | "missing" | "restraint" | "damage" | "medication_error" | "complaint" | "near_miss";
  report_completed_date: string | null;
  completed_within_24h: boolean;
  severity: "low" | "medium" | "high" | "critical";
  witness_statements_obtained: boolean;
  body_map_completed: boolean;
  manager_notified: boolean;
  manager_signed_off: boolean;
  ofsted_notified: boolean;
  ofsted_notification_required: boolean;
  local_authority_notified: boolean;
  local_authority_notification_required: boolean;
  follow_up_actions_identified: number;
  follow_up_actions_completed: number;
  lessons_learned_recorded: boolean;
  created_at: string;
}

export interface RegulatoryDocumentInput {
  id: string;
  document_type: "reg_44" | "reg_45" | "statement_of_purpose" | "children_guide" | "location_risk_assessment" | "complaints_log" | "sanctions_log" | "restraint_log" | "missing_log" | "medication_log" | "fire_drill_log" | "maintenance_log" | "staff_training_log" | "notification_log";
  title: string;
  due_date: string | null;
  completed_date: string | null;
  is_current: boolean;
  is_overdue: boolean;
  quality_rating: number; // 1-5
  author_name: string;
  reviewed_by_manager: boolean;
  meets_statutory_requirements: boolean;
  last_updated_date: string | null;
  update_frequency_days: number;
  days_since_last_update: number;
  created_at: string;
}

export interface RecordKeepingInput {
  today: string;
  total_children: number;
  daily_log_records: DailyLogInput[];
  care_plan_records: CarePlanInput[];
  risk_assessment_records: RiskAssessmentInput[];
  incident_report_records: IncidentReportInput[];
  regulatory_document_records: RegulatoryDocumentInput[];
}

// -- Output Types --------------------------------------------------------------

export type RecordKeepingRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface RecordKeepingInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface RecordKeepingRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface RecordKeepingResult {
  documentation_rating: RecordKeepingRating;
  documentation_score: number;
  headline: string;
  daily_log_completion_rate: number;
  care_plan_currency_rate: number;
  risk_assessment_review_rate: number;
  incident_report_timeliness_rate: number;
  regulatory_compliance_rate: number;
  record_accuracy_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: RecordKeepingRecommendation[];
  insights: RecordKeepingInsight[];
}

// -- Helpers -------------------------------------------------------------------

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): RecordKeepingRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// -- Empty Result Factory ------------------------------------------------------

function emptyResult(
  rating: RecordKeepingRating,
  score: number,
  headline: string,
): RecordKeepingResult {
  return {
    documentation_rating: rating,
    documentation_score: score,
    headline,
    daily_log_completion_rate: 0,
    care_plan_currency_rate: 0,
    risk_assessment_review_rate: 0,
    incident_report_timeliness_rate: 0,
    regulatory_compliance_rate: 0,
    record_accuracy_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ==============================================================================
// MAIN COMPUTE
// ==============================================================================

export function computeRecordKeepingDocumentationQuality(
  input: RecordKeepingInput,
): RecordKeepingResult {
  const {
    today,
    total_children,
    daily_log_records,
    care_plan_records,
    risk_assessment_records,
    incident_report_records,
    regulatory_document_records,
  } = input;

  // -- Special case: all empty + 0 children -> insufficient_data ----------------
  const allEmpty =
    daily_log_records.length === 0 &&
    care_plan_records.length === 0 &&
    risk_assessment_records.length === 0 &&
    incident_report_records.length === 0 &&
    regulatory_document_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement and no records found -- insufficient data to assess record keeping and documentation quality.",
    );
  }

  // -- Special case: all empty + children > 0 -> inadequate ---------------------
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No documentation records found despite children on placement -- record keeping requires urgent attention to meet regulatory requirements.",
      ),
      concerns: [
        "No daily logs, care plans, risk assessments, incident reports, or regulatory documents exist despite children being on placement -- the home cannot evidence the quality of care being delivered or compliance with statutory record keeping requirements.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement daily recording for all children immediately -- daily logs are a fundamental requirement under Reg 36 and provide the primary evidence base for the quality of care children receive.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 36 -- Review of quality of care",
        },
        {
          rank: 2,
          recommendation:
            "Establish and maintain all statutory records and notifications -- the absence of regulatory documentation represents a serious compliance failure that Ofsted will view as a significant shortfall in leadership and management.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 37-40 -- Records and notifications",
        },
      ],
      insights: [
        {
          text: "The complete absence of documentation records means the home cannot demonstrate compliance with any aspect of Reg 36 (review of quality of care) or Reg 37-40 (records and notifications). Ofsted expects comprehensive record keeping as a fundamental indicator of effective leadership and management. This level of absence would likely result in an inadequate judgement for leadership and management under SCCIF.",
          severity: "critical",
        },
      ],
    };
  }

  // ============================================================================
  // COMPUTE CORE METRICS
  // ============================================================================

  // --- 1. Daily Log Completion Rate -------------------------------------------
  // Measures: proportion of daily logs completed on time

  const totalLogs = daily_log_records.length;
  const logsCompletedOnTime = daily_log_records.filter(
    (l) => l.completed_on_time,
  ).length;
  const dailyLogCompletionRate = pct(logsCompletedOnTime, totalLogs);

  // Daily log quality sub-metrics
  const logsWithWellbeing = daily_log_records.filter(
    (l) => l.covers_wellbeing,
  ).length;
  const wellbeingCoverageRate = pct(logsWithWellbeing, totalLogs);

  const logsWithActivities = daily_log_records.filter(
    (l) => l.covers_activities,
  ).length;
  const activityCoverageRate = pct(logsWithActivities, totalLogs);

  const logsWithMood = daily_log_records.filter(
    (l) => l.covers_mood,
  ).length;
  const moodCoverageRate = pct(logsWithMood, totalLogs);

  const logsWithInteractions = daily_log_records.filter(
    (l) => l.covers_interactions,
  ).length;
  const interactionCoverageRate = pct(logsWithInteractions, totalLogs);

  const logsWithMeals = daily_log_records.filter(
    (l) => l.covers_meals,
  ).length;
  const mealCoverageRate = pct(logsWithMeals, totalLogs);

  const comprehensiveLogs = daily_log_records.filter(
    (l) =>
      l.covers_wellbeing &&
      l.covers_activities &&
      l.covers_mood &&
      l.covers_interactions &&
      l.covers_meals,
  ).length;
  const comprehensiveLogRate = pct(comprehensiveLogs, totalLogs);

  const logsManagerReviewed = daily_log_records.filter(
    (l) => l.manager_reviewed,
  ).length;
  const managerReviewRate = pct(logsManagerReviewed, totalLogs);

  const logsSigned = daily_log_records.filter(
    (l) => l.signed_by_author,
  ).length;
  const logSigningRate = pct(logsSigned, totalLogs);

  const logsFactualObjective = daily_log_records.filter(
    (l) => l.factual_and_objective,
  ).length;
  const factualObjectiveRate = pct(logsFactualObjective, totalLogs);

  const logsWithAdequateDetail = daily_log_records.filter(
    (l) => l.word_count >= 50,
  ).length;
  const detailRate = pct(logsWithAdequateDetail, totalLogs);

  // Unique children covered by daily logs
  const uniqueChildrenWithLogs = new Set(
    daily_log_records.map((l) => l.child_id),
  ).size;
  const logChildCoverageRate =
    total_children > 0 ? pct(uniqueChildrenWithLogs, total_children) : 0;

  // --- 2. Care Plan Currency Rate ---------------------------------------------
  // Measures: proportion of care plans that are current and not overdue for review

  const totalCarePlans = care_plan_records.length;
  const currentCarePlans = care_plan_records.filter(
    (cp) => cp.is_current,
  ).length;
  const overdueCarePlanReviews = care_plan_records.filter(
    (cp) => cp.review_overdue && cp.is_current,
  ).length;
  const carePlanCurrencyRate =
    currentCarePlans > 0
      ? pct(currentCarePlans - overdueCarePlanReviews, currentCarePlans)
      : 0;

  // Care plan quality sub-metrics
  const carePlansChildParticipated = care_plan_records.filter(
    (cp) => cp.child_participated && cp.is_current,
  ).length;
  const childParticipationRate = pct(carePlansChildParticipated, currentCarePlans);

  // Objectives met rate across current care plans
  const totalObjectives = care_plan_records
    .filter((cp) => cp.is_current)
    .reduce((sum, cp) => sum + cp.objectives_count, 0);
  const totalObjectivesMet = care_plan_records
    .filter((cp) => cp.is_current)
    .reduce((sum, cp) => sum + cp.objectives_met, 0);
  const objectivesMetRate = pct(totalObjectivesMet, totalObjectives);

  // Unique children with current care plans
  const uniqueChildrenWithPlans = new Set(
    care_plan_records.filter((cp) => cp.is_current).map((cp) => cp.child_id),
  ).size;
  const carePlanChildCoverageRate =
    total_children > 0 ? pct(uniqueChildrenWithPlans, total_children) : 0;

  // --- 3. Risk Assessment Review Rate -----------------------------------------
  // Measures: proportion of current risk assessments with up-to-date reviews

  const totalRiskAssessments = risk_assessment_records.length;
  const currentRiskAssessments = risk_assessment_records.filter(
    (ra) => ra.is_current,
  ).length;
  const overdueRiskReviews = risk_assessment_records.filter(
    (ra) => ra.review_overdue && ra.is_current,
  ).length;
  const riskAssessmentReviewRate =
    currentRiskAssessments > 0
      ? pct(currentRiskAssessments - overdueRiskReviews, currentRiskAssessments)
      : 0;

  // Risk assessment quality sub-metrics
  const riskMultiAgency = risk_assessment_records.filter(
    (ra) => ra.multi_agency_input && ra.is_current,
  ).length;
  const riskMultiAgencyRate = pct(riskMultiAgency, currentRiskAssessments);

  const riskDynamicFactors = risk_assessment_records.filter(
    (ra) => ra.dynamic_risk_factors_recorded && ra.is_current,
  ).length;
  const dynamicFactorsRate = pct(riskDynamicFactors, currentRiskAssessments);

  const riskLinkedToCarePlan = risk_assessment_records.filter(
    (ra) => ra.linked_to_care_plan && ra.is_current,
  ).length;
  const linkedToCarePlanRate = pct(riskLinkedToCarePlan, currentRiskAssessments);

  // Mitigation implementation rate
  const totalMitigations = risk_assessment_records
    .filter((ra) => ra.is_current)
    .reduce((sum, ra) => sum + ra.mitigations_identified, 0);
  const mitigationsImplemented = risk_assessment_records
    .filter((ra) => ra.is_current)
    .reduce((sum, ra) => sum + ra.mitigations_implemented, 0);
  const mitigationImplementationRate = pct(mitigationsImplemented, totalMitigations);

  // High/very-high risk assessments
  const highRiskAssessments = risk_assessment_records.filter(
    (ra) => (ra.risk_level === "high" || ra.risk_level === "very_high") && ra.is_current,
  ).length;
  const highRiskOverdue = risk_assessment_records.filter(
    (ra) =>
      (ra.risk_level === "high" || ra.risk_level === "very_high") &&
      ra.is_current &&
      ra.review_overdue,
  ).length;

  // Unique children with current risk assessments
  const uniqueChildrenWithRiskAssessments = new Set(
    risk_assessment_records.filter((ra) => ra.is_current).map((ra) => ra.child_id),
  ).size;
  const riskAssessmentChildCoverageRate =
    total_children > 0 ? pct(uniqueChildrenWithRiskAssessments, total_children) : 0;

  // --- 4. Incident Report Timeliness Rate -------------------------------------
  // Measures: proportion of incident reports completed within 24 hours

  const totalIncidents = incident_report_records.length;
  const incidentsCompletedWithin24h = incident_report_records.filter(
    (ir) => ir.completed_within_24h,
  ).length;
  const incidentReportTimelinessRate = pct(incidentsCompletedWithin24h, totalIncidents);

  // Incident report quality sub-metrics
  const incidentsManagerSignedOff = incident_report_records.filter(
    (ir) => ir.manager_signed_off,
  ).length;
  const managerSignOffRate = pct(incidentsManagerSignedOff, totalIncidents);

  // Ofsted notification compliance
  const ofstedNotificationRequired = incident_report_records.filter(
    (ir) => ir.ofsted_notification_required,
  ).length;
  const ofstedNotified = incident_report_records.filter(
    (ir) => ir.ofsted_notification_required && ir.ofsted_notified,
  ).length;
  const ofstedNotificationRate = pct(ofstedNotified, ofstedNotificationRequired);

  // Local authority notification compliance
  const laNotificationRequired = incident_report_records.filter(
    (ir) => ir.local_authority_notification_required,
  ).length;
  const laNotified = incident_report_records.filter(
    (ir) => ir.local_authority_notification_required && ir.local_authority_notified,
  ).length;
  const laNotificationRate = pct(laNotified, laNotificationRequired);

  // Follow-up action completion
  const totalFollowUps = incident_report_records.reduce(
    (sum, ir) => sum + ir.follow_up_actions_identified,
    0,
  );
  const completedFollowUps = incident_report_records.reduce(
    (sum, ir) => sum + ir.follow_up_actions_completed,
    0,
  );
  const followUpCompletionRate = pct(completedFollowUps, totalFollowUps);

  // Lessons learned
  const incidentsWithLessonsLearned = incident_report_records.filter(
    (ir) => ir.lessons_learned_recorded,
  ).length;
  const lessonsLearnedRate = pct(incidentsWithLessonsLearned, totalIncidents);

  // Critical/high severity incidents
  const criticalIncidents = incident_report_records.filter(
    (ir) => ir.severity === "critical" || ir.severity === "high",
  ).length;
  const criticalIncidentsLateReported = incident_report_records.filter(
    (ir) =>
      (ir.severity === "critical" || ir.severity === "high") &&
      !ir.completed_within_24h,
  ).length;

  // --- 5. Regulatory Compliance Rate ------------------------------------------
  // Measures: proportion of regulatory documents that are current and meet requirements

  const totalRegDocs = regulatory_document_records.length;
  const currentRegDocs = regulatory_document_records.filter(
    (rd) => rd.is_current,
  ).length;
  const overdueRegDocs = regulatory_document_records.filter(
    (rd) => rd.is_overdue,
  ).length;
  const meetsStatutoryReqs = regulatory_document_records.filter(
    (rd) => rd.meets_statutory_requirements && rd.is_current,
  ).length;
  const regulatoryComplianceRate =
    totalRegDocs > 0 ? pct(meetsStatutoryReqs, totalRegDocs) : 0;

  // Regulatory document quality sub-metrics
  const regDocsManagerReviewed = regulatory_document_records.filter(
    (rd) => rd.reviewed_by_manager && rd.is_current,
  ).length;
  const regDocManagerReviewRate = pct(regDocsManagerReviewed, currentRegDocs);

  // Stale documents (not updated beyond their update frequency)
  const staleRegDocs = regulatory_document_records.filter(
    (rd) =>
      rd.is_current &&
      rd.update_frequency_days > 0 &&
      rd.days_since_last_update > rd.update_frequency_days,
  ).length;

  // --- 6. Record Accuracy Rate ------------------------------------------------
  // Composite: factual/objective logs + signed logs + manager-reviewed records

  const accuracyNumerator =
    logsFactualObjective +
    logsSigned +
    logsManagerReviewed +
    incidentsManagerSignedOff +
    regDocsManagerReviewed;
  const accuracyDenominator =
    totalLogs +   // factual/objective
    totalLogs +   // signed
    totalLogs +   // manager reviewed
    totalIncidents + // manager signed off
    currentRegDocs;  // manager reviewed
  const recordAccuracyRate = pct(accuracyNumerator, accuracyDenominator);

  // ============================================================================
  // SCORING: base 52, max bonuses = +28, total potential = 80 for outstanding
  // ============================================================================

  let score = 52;

  // --- Bonus 1: dailyLogCompletionRate (>=95: +4, >=80: +2) ---
  if (dailyLogCompletionRate >= 95) score += 4;
  else if (dailyLogCompletionRate >= 80) score += 2;

  // --- Bonus 2: carePlanCurrencyRate (>=95: +4, >=80: +2) ---
  if (carePlanCurrencyRate >= 95) score += 4;
  else if (carePlanCurrencyRate >= 80) score += 2;

  // --- Bonus 3: riskAssessmentReviewRate (>=95: +3, >=80: +1) ---
  if (riskAssessmentReviewRate >= 95) score += 3;
  else if (riskAssessmentReviewRate >= 80) score += 1;

  // --- Bonus 4: incidentReportTimelinessRate (>=95: +3, >=80: +1) ---
  if (incidentReportTimelinessRate >= 95) score += 3;
  else if (incidentReportTimelinessRate >= 80) score += 1;

  // --- Bonus 5: regulatoryComplianceRate (>=95: +4, >=80: +2) ---
  if (regulatoryComplianceRate >= 95) score += 4;
  else if (regulatoryComplianceRate >= 80) score += 2;

  // --- Bonus 6: recordAccuracyRate (>=90: +3, >=75: +1) ---
  if (recordAccuracyRate >= 90) score += 3;
  else if (recordAccuracyRate >= 75) score += 1;

  // --- Bonus 7: comprehensiveLogRate (>=90: +3, >=70: +1) ---
  if (comprehensiveLogRate >= 90) score += 3;
  else if (comprehensiveLogRate >= 70) score += 1;

  // --- Bonus 8: ofstedNotificationRate + laNotificationRate (both >=100: +2, both >=80: +1) ---
  if (
    (ofstedNotificationRate >= 100 || ofstedNotificationRequired === 0) &&
    (laNotificationRate >= 100 || laNotificationRequired === 0)
  ) {
    score += 2;
  } else if (
    (ofstedNotificationRate >= 80 || ofstedNotificationRequired === 0) &&
    (laNotificationRate >= 80 || laNotificationRequired === 0)
  ) {
    score += 1;
  }

  // --- Bonus 9: mitigationImplementationRate (>=95: +2, >=80: +1) ---
  if (mitigationImplementationRate >= 95) score += 2;
  else if (mitigationImplementationRate >= 80) score += 1;

  // Total max bonuses: 4+4+3+3+4+3+3+2+2 = 28 => 52+28 = 80

  // ============================================================================
  // PENALTIES (guarded by array length > 0)
  // ============================================================================

  // Penalty 1: dailyLogCompletionRate < 50 -> -5
  if (dailyLogCompletionRate < 50 && totalLogs > 0) score -= 5;

  // Penalty 2: carePlanCurrencyRate < 50 -> -6
  if (carePlanCurrencyRate < 50 && currentCarePlans > 0) score -= 6;

  // Penalty 3: incidentReportTimelinessRate < 50 -> -5
  if (incidentReportTimelinessRate < 50 && totalIncidents > 0) score -= 5;

  // Penalty 4: regulatoryComplianceRate < 50 -> -3
  if (regulatoryComplianceRate < 50 && totalRegDocs > 0) score -= 3;

  score = clamp(score, 0, 100);

  const documentation_rating = toRating(score);

  // ============================================================================
  // STRENGTHS
  // ============================================================================

  const strengths: string[] = [];

  // Daily log strengths
  if (dailyLogCompletionRate >= 95 && totalLogs > 0) {
    strengths.push(
      `${dailyLogCompletionRate}% of daily logs completed on time -- the home demonstrates excellent timeliness in recording children's daily experiences, providing a reliable and up-to-date evidence base for quality of care.`,
    );
  } else if (dailyLogCompletionRate >= 80 && totalLogs > 0) {
    strengths.push(
      `${dailyLogCompletionRate}% daily log completion rate -- strong timeliness in day-to-day recording, ensuring children's experiences are captured while events are fresh.`,
    );
  }

  if (comprehensiveLogRate >= 90 && totalLogs > 0) {
    strengths.push(
      `${comprehensiveLogRate}% of daily logs cover all five core areas (wellbeing, activities, mood, interactions, meals) -- the home produces rich, holistic records that paint a complete picture of each child's day.`,
    );
  } else if (comprehensiveLogRate >= 70 && totalLogs > 0) {
    strengths.push(
      `${comprehensiveLogRate}% of logs are comprehensive across all core areas -- recording generally captures the full breadth of children's daily experiences.`,
    );
  }

  if (managerReviewRate >= 90 && totalLogs > 0) {
    strengths.push(
      `${managerReviewRate}% of daily logs reviewed by management -- strong oversight ensures recording quality is maintained.`,
    );
  }

  // Care plan strengths
  if (carePlanCurrencyRate >= 95 && currentCarePlans > 0) {
    strengths.push(
      `${carePlanCurrencyRate}% of care plans are current with up-to-date reviews -- the home ensures care planning remains responsive to children's evolving needs.`,
    );
  } else if (carePlanCurrencyRate >= 80 && currentCarePlans > 0) {
    strengths.push(
      `${carePlanCurrencyRate}% care plan currency rate -- the majority of care plans are reviewed on schedule, supporting effective care delivery.`,
    );
  }

  if (childParticipationRate >= 90 && currentCarePlans > 0) {
    strengths.push(
      `Children participate in ${childParticipationRate}% of their care plans -- the home demonstrates strong practice in ensuring children are central to their own care planning.`,
    );
  } else if (childParticipationRate >= 70 && currentCarePlans > 0) {
    strengths.push(
      `${childParticipationRate}% child participation in care planning -- good levels of child involvement in shaping their own care arrangements.`,
    );
  }

  if (objectivesMetRate >= 80 && totalObjectives > 0) {
    strengths.push(
      `${objectivesMetRate}% of care plan objectives being met -- care plans are driving real outcomes for children.`,
    );
  }

  // Risk assessment strengths
  if (riskAssessmentReviewRate >= 95 && currentRiskAssessments > 0) {
    strengths.push(
      `${riskAssessmentReviewRate}% of risk assessments have up-to-date reviews -- the home keeps risk management current and responsive to changing circumstances.`,
    );
  } else if (riskAssessmentReviewRate >= 80 && currentRiskAssessments > 0) {
    strengths.push(
      `${riskAssessmentReviewRate}% risk assessment review compliance -- strong oversight of risk documentation ensures assessments remain relevant.`,
    );
  }

  if (mitigationImplementationRate >= 95 && totalMitigations > 0) {
    strengths.push(
      `${mitigationImplementationRate}% of identified risk mitigations implemented -- the home follows through on protective measures, ensuring risk management translates into practical safeguards for children.`,
    );
  } else if (mitigationImplementationRate >= 80 && totalMitigations > 0) {
    strengths.push(
      `${mitigationImplementationRate}% mitigation implementation -- the majority of identified risk controls are in place.`,
    );
  }

  if (riskMultiAgencyRate >= 80 && currentRiskAssessments > 0) {
    strengths.push(
      `${riskMultiAgencyRate}% of risk assessments include multi-agency input -- collaborative risk assessment ensures a complete picture of each child's risks.`,
    );
  }

  // Incident report strengths
  if (incidentReportTimelinessRate >= 95 && totalIncidents > 0) {
    strengths.push(
      `${incidentReportTimelinessRate}% of incident reports completed within 24 hours -- the home responds quickly to document incidents, ensuring details are accurate and follow-up is prompt.`,
    );
  } else if (incidentReportTimelinessRate >= 80 && totalIncidents > 0) {
    strengths.push(
      `${incidentReportTimelinessRate}% incident report timeliness -- strong reporting culture with incidents documented promptly after occurrence.`,
    );
  }

  if (ofstedNotificationRate >= 100 && ofstedNotificationRequired > 0) {
    strengths.push(
      "All required Ofsted notifications have been made -- the home maintains full compliance with statutory notification obligations under Reg 40.",
    );
  }

  if (laNotificationRate >= 100 && laNotificationRequired > 0) {
    strengths.push(
      "All required local authority notifications have been made -- the home fulfils its duty to keep placing authorities informed of significant events.",
    );
  }

  if (followUpCompletionRate >= 90 && totalFollowUps > 0) {
    strengths.push(
      `${followUpCompletionRate}% of incident follow-up actions completed -- the home ensures incidents lead to meaningful action, not just paperwork.`,
    );
  }

  if (lessonsLearnedRate >= 80 && totalIncidents > 0) {
    strengths.push(
      `Lessons learned recorded for ${lessonsLearnedRate}% of incidents -- the home uses incidents for organisational learning.`,
    );
  }

  // Regulatory compliance strengths
  if (regulatoryComplianceRate >= 95 && totalRegDocs > 0) {
    strengths.push(
      `${regulatoryComplianceRate}% regulatory document compliance -- the home maintains all statutory documentation to the required standard, evidencing strong leadership and management.`,
    );
  } else if (regulatoryComplianceRate >= 80 && totalRegDocs > 0) {
    strengths.push(
      `${regulatoryComplianceRate}% regulatory compliance rate -- the majority of statutory documentation meets requirements.`,
    );
  }

  // Record accuracy strengths
  if (recordAccuracyRate >= 90) {
    strengths.push(
      `${recordAccuracyRate}% record accuracy rate -- the home maintains consistently high standards of record quality with proper signing, factual recording, and management oversight.`,
    );
  } else if (recordAccuracyRate >= 75) {
    strengths.push(
      `${recordAccuracyRate}% record accuracy -- good overall standard of record quality with appropriate checks and balances.`,
    );
  }

  if (logChildCoverageRate >= 100 && carePlanChildCoverageRate >= 100 && riskAssessmentChildCoverageRate >= 100 && total_children > 0) {
    strengths.push(
      "Every child on placement has daily logs, current care plans, and risk assessments -- complete documentation coverage.",
    );
  }

  // ============================================================================
  // CONCERNS
  // ============================================================================

  const concerns: string[] = [];

  // Daily log concerns
  if (dailyLogCompletionRate < 50 && totalLogs > 0) {
    concerns.push(
      `Only ${dailyLogCompletionRate}% of daily logs completed on time -- the majority of records are late, undermining their accuracy and the home's ability to evidence timely care under Reg 36.`,
    );
  } else if (dailyLogCompletionRate < 80 && dailyLogCompletionRate >= 50 && totalLogs > 0) {
    concerns.push(
      `Daily log completion rate at ${dailyLogCompletionRate}% -- a significant proportion of logs are not completed on time, risking inaccurate recording and gaps in the evidence base.`,
    );
  }

  if (comprehensiveLogRate < 50 && totalLogs > 0) {
    concerns.push(
      `Only ${comprehensiveLogRate}% of daily logs cover all five core areas -- most records are incomplete, failing to capture the full picture of children's daily experiences.`,
    );
  } else if (comprehensiveLogRate < 70 && comprehensiveLogRate >= 50 && totalLogs > 0) {
    concerns.push(
      `Comprehensive log rate at ${comprehensiveLogRate}% -- some daily records lack coverage of key areas such as wellbeing, mood, or interactions, creating an incomplete picture of children's experiences.`,
    );
  }

  if (managerReviewRate < 50 && totalLogs > 0) {
    concerns.push(
      `Only ${managerReviewRate}% of daily logs reviewed by management -- insufficient oversight of recording quality, meaning errors or inappropriate content may go unchecked.`,
    );
  }

  if (logChildCoverageRate < 80 && total_children > 0 && totalLogs > 0) {
    concerns.push(
      `Daily logs cover only ${logChildCoverageRate}% of children -- some children's daily experiences are not being recorded at all, a fundamental gap in care documentation.`,
    );
  }

  // Care plan concerns
  if (carePlanCurrencyRate < 50 && currentCarePlans > 0) {
    concerns.push(
      `Only ${carePlanCurrencyRate}% of care plans have current reviews -- the majority of care plans are out of date, meaning children's care may not reflect their current needs.`,
    );
  } else if (carePlanCurrencyRate < 80 && carePlanCurrencyRate >= 50 && currentCarePlans > 0) {
    concerns.push(
      `Care plan currency rate at ${carePlanCurrencyRate}% -- a notable proportion of care plans are overdue for review, which may result in care that does not reflect children's current circumstances.`,
    );
  }

  if (overdueCarePlanReviews > 0 && currentCarePlans > 0) {
    concerns.push(
      `${overdueCarePlanReviews} care plan review${overdueCarePlanReviews !== 1 ? "s are" : " is"} overdue -- without timely reviews, care plans cannot be relied upon as accurate guides for staff delivering care.`,
    );
  }

  if (childParticipationRate < 50 && currentCarePlans > 0) {
    concerns.push(
      `Children participate in only ${childParticipationRate}% of care plans -- the majority of care plans are written about children rather than with them, undermining the child-centred approach required by SCCIF.`,
    );
  }

  // Risk assessment concerns
  if (riskAssessmentReviewRate < 50 && currentRiskAssessments > 0) {
    concerns.push(
      `Only ${riskAssessmentReviewRate}% of risk assessments have current reviews -- the majority of risk assessments are out of date, meaning the home's understanding of children's risks may be inaccurate.`,
    );
  } else if (riskAssessmentReviewRate < 80 && riskAssessmentReviewRate >= 50 && currentRiskAssessments > 0) {
    concerns.push(
      `Risk assessment review rate at ${riskAssessmentReviewRate}% -- some risk assessments are overdue for review, which may mean staff are working with outdated risk information.`,
    );
  }

  if (highRiskOverdue > 0) {
    concerns.push(
      `${highRiskOverdue} high/very-high risk assessment${highRiskOverdue !== 1 ? "s are" : " is"} overdue for review -- overdue reviews of high-risk assessments represent a serious safeguarding concern as risk management may be based on outdated information.`,
    );
  }

  if (mitigationImplementationRate < 50 && totalMitigations > 0) {
    concerns.push(
      `Only ${mitigationImplementationRate}% of identified risk mitigations have been implemented -- the home identifies risks but fails to follow through on protective measures, leaving children exposed to known risks.`,
    );
  } else if (mitigationImplementationRate < 80 && mitigationImplementationRate >= 50 && totalMitigations > 0) {
    concerns.push(
      `Mitigation implementation at ${mitigationImplementationRate}% -- some identified risk controls are not yet in place, potentially leaving gaps in children's protection.`,
    );
  }

  // Incident report concerns
  if (incidentReportTimelinessRate < 50 && totalIncidents > 0) {
    concerns.push(
      `Only ${incidentReportTimelinessRate}% of incident reports completed within 24 hours -- the majority of incidents are reported late, reducing accuracy and delaying necessary follow-up actions.`,
    );
  } else if (incidentReportTimelinessRate < 80 && incidentReportTimelinessRate >= 50 && totalIncidents > 0) {
    concerns.push(
      `Incident report timeliness at ${incidentReportTimelinessRate}% -- a notable proportion of incidents are not reported promptly, which may affect the quality and reliability of the record.`,
    );
  }

  if (criticalIncidentsLateReported > 0) {
    concerns.push(
      `${criticalIncidentsLateReported} critical/high-severity incident${criticalIncidentsLateReported !== 1 ? "s were" : " was"} not reported within 24 hours -- late reporting of serious incidents is a significant concern, potentially delaying safeguarding responses and statutory notifications.`,
    );
  }

  if (ofstedNotificationRate < 100 && ofstedNotificationRequired > 0) {
    const missed = ofstedNotificationRequired - ofstedNotified;
    concerns.push(
      `${missed} required Ofsted notification${missed !== 1 ? "s have" : " has"} not been made -- failure to notify Ofsted of notifiable events is a serious regulatory breach under Reg 40.`,
    );
  }

  if (laNotificationRate < 100 && laNotificationRequired > 0) {
    const missed = laNotificationRequired - laNotified;
    concerns.push(
      `${missed} required local authority notification${missed !== 1 ? "s have" : " has"} not been made -- the home must notify placing authorities of significant events affecting the children they are responsible for.`,
    );
  }

  // Regulatory compliance concerns
  if (regulatoryComplianceRate < 50 && totalRegDocs > 0) {
    concerns.push(
      `Only ${regulatoryComplianceRate}% of regulatory documents meet statutory requirements -- the home is not maintaining the minimum documentation standard required by the regulations.`,
    );
  } else if (regulatoryComplianceRate < 80 && regulatoryComplianceRate >= 50 && totalRegDocs > 0) {
    concerns.push(
      `Regulatory compliance rate at ${regulatoryComplianceRate}% -- some statutory documents do not meet the required standard, which Ofsted will view as a shortfall in leadership and management.`,
    );
  }

  if (overdueRegDocs > 0) {
    concerns.push(
      `${overdueRegDocs} regulatory document${overdueRegDocs !== 1 ? "s are" : " is"} overdue -- overdue statutory documents represent a compliance gap that must be addressed before the next inspection.`,
    );
  }

  if (staleRegDocs > 0 && totalRegDocs > 0) {
    concerns.push(
      `${staleRegDocs} regulatory document${staleRegDocs !== 1 ? "s have" : " has"} not been updated within their required frequency.`,
    );
  }

  // ============================================================================
  // RECOMMENDATIONS
  // ============================================================================

  const recommendations: RecordKeepingRecommendation[] = [];
  let rank = 0;

  // Immediate recommendations
  if (dailyLogCompletionRate < 50 && totalLogs > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently address daily log completion -- implement a real-time recording system with shift-end completion checks and management alerts for overdue entries. Daily logs are the primary evidence of the quality of care children receive.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 36 -- Review of quality of care",
    });
  }

  if (carePlanCurrencyRate < 50 && currentCarePlans > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Immediately review and update all overdue care plans -- children's care must be guided by current, reviewed plans that reflect their present needs. Out-of-date care plans cannot safely direct the care children receive.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 36 -- Review of quality of care",
    });
  }

  if (highRiskOverdue > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review all overdue high/very-high risk assessments -- children with elevated risk levels must have current, accurate risk management in place. Overdue reviews of high-risk assessments represent a direct safeguarding concern.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 37 -- Notifiable events",
    });
  }

  if (ofstedNotificationRate < 100 && ofstedNotificationRequired > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Immediately make all outstanding Ofsted notifications -- failure to notify the regulator of notifiable events is a serious regulatory breach. Review the notification process to prevent future omissions.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 40 -- Notification of events",
    });
  }

  if (laNotificationRate < 100 && laNotificationRequired > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Immediately complete all outstanding local authority notifications -- placing authorities must be informed of significant events affecting the children in their care. Establish a notification checklist for all reportable incidents.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 37 -- Notifiable events",
    });
  }

  if (incidentReportTimelinessRate < 50 && totalIncidents > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Overhaul incident reporting procedures to ensure all incidents are documented within 24 hours -- implement mobile reporting tools, clear escalation procedures, and management oversight to eliminate delays in capturing critical safety information.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 36 -- Review of quality of care",
    });
  }

  if (regulatoryComplianceRate < 50 && totalRegDocs > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently bring all statutory documentation up to the required standard -- non-compliant regulatory documents represent a fundamental failure in leadership and management that Ofsted will view seriously.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 38 -- Employment of staff records",
    });
  }

  if (mitigationImplementationRate < 50 && totalMitigations > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement all outstanding risk mitigations immediately -- identifying risks without implementing protective measures is worse than not assessing risk at all, as it demonstrates awareness of danger without action to protect children.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 37 -- Notifiable events",
    });
  }

  if (criticalIncidentsLateReported > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all critical and high-severity incidents are reported within 24 hours without exception -- late reporting of serious incidents delays safeguarding responses and may constitute a regulatory breach.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 40 -- Notification of events",
    });
  }

  // Soon recommendations
  if (dailyLogCompletionRate >= 50 && dailyLogCompletionRate < 80 && totalLogs > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve daily log completion rate to at least 80% -- establish clear recording expectations, provide recording guidance to staff, and implement management spot-checks to improve timeliness.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 36 -- Review of quality of care",
    });
  }

  if (comprehensiveLogRate < 70 && totalLogs > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve the comprehensiveness of daily logs -- provide staff with a recording template that prompts coverage of all five core areas (wellbeing, activities, mood, interactions, meals) to ensure a complete picture of each child's day.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 36 -- Review of quality of care",
    });
  }

  if (overdueCarePlanReviews > 0 && currentCarePlans > 0 && carePlanCurrencyRate >= 50) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Complete all overdue care plan reviews -- establish a review calendar with automated reminders to ensure care plans are always reviewed before they become out of date.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 36 -- Review of quality of care",
    });
  }

  if (riskAssessmentReviewRate >= 50 && riskAssessmentReviewRate < 80 && currentRiskAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve risk assessment review compliance to at least 80% -- risk assessments must be regularly reviewed to remain accurate. Establish a risk review schedule linked to care plan review cycles.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 37 -- Notifiable events",
    });
  }

  if (incidentReportTimelinessRate >= 50 && incidentReportTimelinessRate < 80 && totalIncidents > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve incident report timeliness to at least 80% within 24 hours -- consider implementing a streamlined reporting form and clear escalation pathway to reduce barriers to timely reporting.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 36 -- Review of quality of care",
    });
  }

  if (mitigationImplementationRate >= 50 && mitigationImplementationRate < 80 && totalMitigations > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase mitigation implementation rate to at least 80% -- assign clear ownership and deadlines for each outstanding mitigation.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 37 -- Notifiable events",
    });
  }

  if (regulatoryComplianceRate >= 50 && regulatoryComplianceRate < 80 && totalRegDocs > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Bring all regulatory documents up to statutory requirements -- implement a compliance calendar and assign clear ownership.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 39 -- Staffing policy",
    });
  }

  // Planned recommendations
  if (childParticipationRate < 70 && currentCarePlans > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase child participation in care planning -- ensure every child has the opportunity to contribute to their care plans in a way that is meaningful and accessible to them, using age-appropriate and communication-friendly formats.",
      urgency: "planned",
      regulatory_ref: "SCCIF -- Voice of the child",
    });
  }

  if (managerReviewRate < 70 && totalLogs > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase management review of daily logs -- establish a daily review process where management checks a sample of logs for quality, accuracy, and completeness, providing feedback to staff.",
      urgency: "planned",
      regulatory_ref: "SCCIF -- Leadership and management",
    });
  }

  if (lessonsLearnedRate < 70 && totalIncidents > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve lessons-learned recording for incidents -- every incident should contribute to organisational learning. Implement a structured debrief process and share anonymised learning across the staff team.",
      urgency: "planned",
      regulatory_ref: "SCCIF -- Leadership and management",
    });
  }

  if (dynamicFactorsRate < 70 && currentRiskAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all risk assessments record dynamic risk factors -- static risk assessments quickly become outdated. Train staff to identify and document the changing factors that affect each child's risk profile.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 37 -- Notifiable events",
    });
  }

  if (linkedToCarePlanRate < 70 && currentRiskAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen the link between risk assessments and care plans -- risk management strategies should be embedded in care planning so that staff delivering day-to-day care understand and implement risk mitigations.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 36 -- Review of quality of care",
    });
  }

  if (logSigningRate < 80 && totalLogs > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all daily logs are signed by the author -- unsigned records lack accountability and may not be accepted as reliable evidence of care.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 36 -- Review of quality of care",
    });
  }

  // ============================================================================
  // INSIGHTS
  // ============================================================================

  const insights: RecordKeepingInsight[] = [];

  // -- Critical insights --

  if (dailyLogCompletionRate < 50 && totalLogs > 0) {
    insights.push({
      text: `Only ${dailyLogCompletionRate}% of daily logs completed on time. Daily records are the backbone of evidencing quality of care under Reg 36. When the majority of logs are late, the home cannot demonstrate that it has a reliable, contemporaneous record of children's experiences. Ofsted inspectors will examine recording timeliness as a core indicator of the home's care standards.`,
      severity: "critical",
    });
  }

  if (carePlanCurrencyRate < 50 && currentCarePlans > 0) {
    insights.push({
      text: `Only ${carePlanCurrencyRate}% of care plans have current reviews. Out-of-date care plans mean staff may be delivering care based on information that no longer reflects children's needs. Under SCCIF, Ofsted expects care plans to be living documents that are regularly reviewed and updated -- a currency rate below 50% suggests care planning has become a paper exercise rather than a dynamic tool for delivering individualised care.`,
      severity: "critical",
    });
  }

  if (ofstedNotificationRate < 100 && ofstedNotificationRequired > 0) {
    const missed = ofstedNotificationRequired - ofstedNotified;
    insights.push({
      text: `${missed} required Ofsted notification${missed !== 1 ? "s" : ""} not made. Failure to notify Ofsted of notifiable events under Reg 40 is one of the most serious regulatory breaches a children's home can commit. This directly undermines the regulatory framework designed to protect children and will be viewed as a significant failing in leadership and management.`,
      severity: "critical",
    });
  }

  if (highRiskOverdue > 0) {
    insights.push({
      text: `${highRiskOverdue} high/very-high risk assessment${highRiskOverdue !== 1 ? "s are" : " is"} overdue for review. When the highest-risk assessments are not kept current, the home is operating without up-to-date knowledge of the most serious risks to children's safety. This represents a direct safeguarding concern that could contribute to harm if risk factors have changed since the last assessment.`,
      severity: "critical",
    });
  }

  if (regulatoryComplianceRate < 50 && totalRegDocs > 0) {
    insights.push({
      text: `Only ${regulatoryComplianceRate}% of regulatory documents meet statutory requirements. The home's regulatory documentation falls below the minimum standard. Under SCCIF, leadership and management is assessed partly on the basis of record keeping -- a compliance rate below 50% would likely contribute to an inadequate judgement in this area.`,
      severity: "critical",
    });
  }

  if (incidentReportTimelinessRate < 50 && totalIncidents > 0) {
    insights.push({
      text: `Only ${incidentReportTimelinessRate}% of incident reports completed within 24 hours. Late incident reporting means details may be lost or inaccurate, follow-up is delayed, and statutory notifications may be missed. Ofsted expects a culture of prompt, accurate incident recording as evidence of effective safeguarding practice.`,
      severity: "critical",
    });
  }

  if (mitigationImplementationRate < 50 && totalMitigations > 0) {
    insights.push({
      text: `Only ${mitigationImplementationRate}% of identified risk mitigations implemented. The home is identifying risks but not following through on the protective measures needed to manage them. This is arguably worse than not assessing risk at all, as it demonstrates awareness of danger without action to protect children.`,
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (dailyLogCompletionRate >= 50 && dailyLogCompletionRate < 80 && totalLogs > 0) {
    insights.push({
      text: `Daily log completion at ${dailyLogCompletionRate}% -- improving but a significant proportion of records are still late. Each late log reduces the accuracy of the record and creates a gap in the contemporaneous evidence of care. Aim for 95%+ to demonstrate reliable recording practice.`,
      severity: "warning",
    });
  }

  if (carePlanCurrencyRate >= 50 && carePlanCurrencyRate < 80 && currentCarePlans > 0) {
    insights.push({
      text: `Care plan currency at ${carePlanCurrencyRate}% -- some plans are overdue for review. Care plans that are not regularly reviewed may not reflect children's current needs, meaning staff could be working from outdated guidance. Regular review cycles are essential for Reg 36 compliance.`,
      severity: "warning",
    });
  }

  if (riskAssessmentReviewRate >= 50 && riskAssessmentReviewRate < 80 && currentRiskAssessments > 0) {
    insights.push({
      text: `Risk assessment review rate at ${riskAssessmentReviewRate}% -- some assessments are not being reviewed on schedule. Out-of-date risk assessments may not reflect current risks, leaving staff without accurate information to keep children safe.`,
      severity: "warning",
    });
  }

  if (incidentReportTimelinessRate >= 50 && incidentReportTimelinessRate < 80 && totalIncidents > 0) {
    insights.push({
      text: `Incident report timeliness at ${incidentReportTimelinessRate}% -- some incidents are not being documented promptly. Delayed reporting reduces accuracy and may delay necessary safeguarding responses and statutory notifications.`,
      severity: "warning",
    });
  }

  if (regulatoryComplianceRate >= 50 && regulatoryComplianceRate < 80 && totalRegDocs > 0) {
    insights.push({
      text: `Regulatory compliance at ${regulatoryComplianceRate}% -- some statutory documents do not meet the required standard. Under SCCIF, the quality of record keeping is a key indicator of leadership and management effectiveness. Aim for full compliance.`,
      severity: "warning",
    });
  }

  if (mitigationImplementationRate >= 50 && mitigationImplementationRate < 80 && totalMitigations > 0) {
    insights.push({
      text: `Mitigation implementation at ${mitigationImplementationRate}% -- some identified risk controls are not in place. Each unimplemented mitigation represents a gap between known risk and action taken.`,
      severity: "warning",
    });
  }

  // Analysis of incident types
  const incidentTypeCounts: Record<string, number> = {};
  for (const ir of incident_report_records) {
    incidentTypeCounts[ir.incident_type] = (incidentTypeCounts[ir.incident_type] ?? 0) + 1;
  }
  const topIncidentTypes = Object.entries(incidentTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  if (topIncidentTypes.length > 0 && totalIncidents >= 3) {
    const incStr = topIncidentTypes
      .map(([t, c]) => `${t.replace(/_/g, " ")} (${c})`)
      .join(", ");
    insights.push({
      text: `Incident profile: ${incStr}. Understanding the pattern of incidents helps identify systemic issues requiring changes to policy, training, or environment.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (documentation_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding record keeping and documentation quality -- daily logs are completed on time with comprehensive content, care plans are current and child-centred, risk assessments are up to date with implemented mitigations, incident reports are timely with completed follow-up actions, and regulatory documentation meets all statutory requirements. This is strong evidence of effective leadership and management under SCCIF.",
      severity: "positive",
    });
  }

  if (
    dailyLogCompletionRate >= 95 &&
    comprehensiveLogRate >= 90 &&
    managerReviewRate >= 90 &&
    totalLogs > 0
  ) {
    insights.push({
      text: `Daily recording at ${dailyLogCompletionRate}% completion with ${comprehensiveLogRate}% comprehensive coverage and ${managerReviewRate}% management review -- the home's daily recording practice is exemplary. Staff produce timely, detailed records that are actively overseen by management, creating a robust evidence base for the quality of care children receive.`,
      severity: "positive",
    });
  }

  if (
    carePlanCurrencyRate >= 95 &&
    childParticipationRate >= 90 &&
    currentCarePlans > 0
  ) {
    insights.push({
      text: `${carePlanCurrencyRate}% care plan currency with ${childParticipationRate}% child participation -- care plans are not just current but genuinely child-centred. This demonstrates that care planning is a dynamic, participatory process that keeps children at the centre of decisions about their own care.`,
      severity: "positive",
    });
  }

  if (
    riskAssessmentReviewRate >= 95 &&
    mitigationImplementationRate >= 95 &&
    currentRiskAssessments > 0 &&
    totalMitigations > 0
  ) {
    insights.push({
      text: `${riskAssessmentReviewRate}% risk assessment review rate with ${mitigationImplementationRate}% mitigation implementation -- the home maintains current, actionable risk management. Risk assessments are not just documents but working tools that translate directly into practical safeguards for children.`,
      severity: "positive",
    });
  }

  if (
    incidentReportTimelinessRate >= 95 &&
    followUpCompletionRate >= 90 &&
    lessonsLearnedRate >= 80 &&
    totalIncidents > 0
  ) {
    insights.push({
      text: `${incidentReportTimelinessRate}% incident timeliness with ${followUpCompletionRate}% follow-up completion and ${lessonsLearnedRate}% lessons learned -- the home operates an exemplary incident management cycle. Incidents are promptly recorded, actions are completed, and learning is captured to prevent recurrence.`,
      severity: "positive",
    });
  }

  if (
    ofstedNotificationRate >= 100 &&
    laNotificationRate >= 100 &&
    ofstedNotificationRequired > 0 &&
    laNotificationRequired > 0
  ) {
    insights.push({
      text: "Full compliance with both Ofsted and local authority notification requirements -- the home maintains complete transparency with regulators and placing authorities, demonstrating accountability and commitment to the multi-agency safeguarding framework.",
      severity: "positive",
    });
  }

  if (
    regulatoryComplianceRate >= 95 &&
    regDocManagerReviewRate >= 95 &&
    totalRegDocs > 0
  ) {
    insights.push({
      text: `${regulatoryComplianceRate}% regulatory compliance with ${regDocManagerReviewRate}% management review -- the home's statutory documentation is both compliant and actively overseen by the registered manager. This evidences the leadership and management standards expected under SCCIF.`,
      severity: "positive",
    });
  }

  if (
    logChildCoverageRate >= 100 &&
    carePlanChildCoverageRate >= 100 &&
    riskAssessmentChildCoverageRate >= 100 &&
    total_children > 0 &&
    totalLogs > 0 &&
    totalCarePlans > 0 &&
    totalRiskAssessments > 0
  ) {
    insights.push({
      text: "Every child has daily logs, current care plans, and active risk assessments -- complete documentation coverage ensures no child's needs or risks are overlooked.",
      severity: "positive",
    });
  }

  // ============================================================================
  // HEADLINE
  // ============================================================================

  let headline: string;

  if (documentation_rating === "outstanding") {
    headline =
      "Outstanding record keeping and documentation quality -- comprehensive, timely, and accurate records evidence effective care delivery and strong leadership and management.";
  } else if (documentation_rating === "good") {
    headline = `Good record keeping and documentation quality -- ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (documentation_rating === "adequate") {
    headline = `Adequate record keeping and documentation -- ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure records fully evidence the quality of care children receive.`;
  } else {
    headline = `Record keeping and documentation is inadequate -- ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to meet regulatory requirements and evidence the quality of care.`;
  }

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    documentation_rating,
    documentation_score: score,
    headline,
    daily_log_completion_rate: dailyLogCompletionRate,
    care_plan_currency_rate: carePlanCurrencyRate,
    risk_assessment_review_rate: riskAssessmentReviewRate,
    incident_report_timeliness_rate: incidentReportTimelinessRate,
    regulatory_compliance_rate: regulatoryComplianceRate,
    record_accuracy_rate: recordAccuracyRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
