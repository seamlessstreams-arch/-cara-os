// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME ASTHMA & RESPIRATORY MANAGEMENT INTELLIGENCE ENGINE
// Monitors respiratory health management across the home — asthma action plan
// coverage, inhaler technique checks, trigger management, peak flow monitoring,
// and emergency preparedness for respiratory events.
// Measures action plan coverage, inhaler technique competency, trigger
// management effectiveness, peak flow monitoring consistency, emergency
// preparedness, and child self-management capability.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 14 (Health care), Reg 5 (Engaging and effective leadership).
// SCCIF: "Health and wellbeing".
// Store keys: asthmaActionPlanRecords, inhalerTechniqueRecords,
//             triggerManagementRecords, peakFlowRecords,
//             emergencyPreparednessRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

import { above, below, meanOf, meets, rate } from "@/lib/metrics/rate";

export interface AsthmaActionPlanRecordInput {
  id: string;
  child_id: string;
  date_created: string;
  date_reviewed: string | null;
  review_due_date: string | null;
  plan_in_place: boolean;
  plan_current: boolean;
  gp_approved: boolean;
  parent_carer_informed: boolean;
  staff_briefed: boolean;
  school_notified: boolean;
  plan_accessible: boolean;
  severity_level: "mild_intermittent" | "mild_persistent" | "moderate_persistent" | "severe_persistent";
  personalised_triggers_documented: boolean;
  medication_details_included: boolean;
  emergency_steps_included: boolean;
  child_involved_in_plan: boolean;
  plan_shared_with_child: boolean;
  notes: string;
  created_at: string;
}

export interface InhalerTechniqueRecordInput {
  id: string;
  child_id: string;
  date: string;
  assessor: string;
  assessor_role: "nurse" | "pharmacist" | "gp" | "staff" | "respiratory_specialist" | "other";
  inhaler_type: "mdi" | "dry_powder" | "soft_mist" | "nebuliser" | "spacer_mdi" | "other";
  technique_correct: boolean;
  steps_completed_correctly: number;
  steps_total: number;
  spacer_used_correctly: boolean;
  child_can_self_administer: boolean;
  child_understands_when_to_use: boolean;
  retraining_needed: boolean;
  retraining_provided: boolean;
  next_check_due: string | null;
  notes: string;
  created_at: string;
}

export interface TriggerManagementRecordInput {
  id: string;
  child_id: string;
  date: string;
  trigger_type: "dust" | "pollen" | "pet_dander" | "mould" | "cold_air" | "exercise" | "smoke" | "chemicals" | "infections" | "stress" | "food" | "other";
  trigger_identified: boolean;
  avoidance_plan_in_place: boolean;
  avoidance_plan_effective: boolean;
  environmental_controls_implemented: boolean;
  child_can_identify_trigger: boolean;
  child_can_manage_exposure: boolean;
  episode_occurred: boolean;
  episode_severity: "mild" | "moderate" | "severe" | "emergency" | null;
  action_taken_appropriate: boolean;
  staff_aware_of_trigger: boolean;
  documented_in_care_plan: boolean;
  notes: string;
  created_at: string;
}

export interface PeakFlowRecordInput {
  id: string;
  child_id: string;
  date: string;
  time_of_day: "morning" | "afternoon" | "evening" | "pre_exercise" | "post_exercise" | "symptomatic";
  reading_value: number;
  personal_best: number;
  zone: "green" | "amber" | "red";
  technique_correct: boolean;
  child_performed_independently: boolean;
  recorded_in_diary: boolean;
  action_required: boolean;
  action_taken: boolean;
  staff_supervised: boolean;
  trend_direction: "improving" | "stable" | "declining" | "variable" | null;
  notes: string;
  created_at: string;
}

export interface EmergencyPreparednessRecordInput {
  id: string;
  date: string;
  assessment_type: "drill" | "equipment_check" | "training" | "protocol_review" | "post_incident_review" | "audit";
  emergency_inhaler_accessible: boolean;
  spacer_available: boolean;
  nebuliser_available: boolean;
  nebuliser_serviced: boolean;
  emergency_protocol_displayed: boolean;
  staff_trained_in_emergency: boolean;
  staff_count_trained: number;
  staff_count_total: number;
  ambulance_procedure_known: boolean;
  emergency_contacts_current: boolean;
  oxygen_saturation_monitor_available: boolean;
  child_id: string | null;
  drill_completed_successfully: boolean;
  response_time_minutes: number | null;
  lessons_identified: string;
  actions_completed: boolean;
  notes: string;
  created_at: string;
}

// ── Output Types ────────────────────────────────────────────────────────────

export type AsthmaRespiratoryRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface AsthmaRespiratoryInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface AsthmaRespiratoryRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface AsthmaRespiratoryResult {
  respiratory_rating: AsthmaRespiratoryRating;
  respiratory_score: number | null;
  headline: string;
  total_action_plan_records: number;
  total_inhaler_technique_records: number;
  total_trigger_management_records: number;
  total_peak_flow_records: number;
  total_emergency_preparedness_records: number;
  action_plan_coverage_rate: number | null;
  inhaler_technique_rate: number | null;
  trigger_management_rate: number | null;
  peak_flow_monitoring_rate: number | null;
  emergency_preparedness_rate: number | null;
  child_self_management_rate: number | null;
  strengths: string[];
  concerns: string[];
  recommendations: AsthmaRespiratoryRecommendation[];
  insights: AsthmaRespiratoryInsight[];
}

export interface AsthmaRespiratoryInput {
  today: string;
  total_children: number;
  action_plan_records: AsthmaActionPlanRecordInput[];
  inhaler_technique_records: InhalerTechniqueRecordInput[];
  trigger_management_records: TriggerManagementRecordInput[];
  peak_flow_records: PeakFlowRecordInput[];
  emergency_preparedness_records: EmergencyPreparednessRecordInput[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

// Was `d === 0 ? 0 : …`: nothing recorded read as 0%, not as unmeasured.
function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): AsthmaRespiratoryRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: AsthmaRespiratoryRating,
  score: number,
  headline: string,
): AsthmaRespiratoryResult {
  return {
    respiratory_rating: rating,
    respiratory_score: score,
    headline,
    total_action_plan_records: 0,
    total_inhaler_technique_records: 0,
    total_trigger_management_records: 0,
    total_peak_flow_records: 0,
    total_emergency_preparedness_records: 0,
    action_plan_coverage_rate: null,
    inhaler_technique_rate: null,
    trigger_management_rate: null,
    peak_flow_monitoring_rate: null,
    emergency_preparedness_rate: null,
    child_self_management_rate: null,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeAsthmaRespiratoryManagement(
  input: AsthmaRespiratoryInput,
): AsthmaRespiratoryResult {
  const {
    today,
    total_children,
    action_plan_records,
    inhaler_technique_records,
    trigger_management_records,
    peak_flow_records,
    emergency_preparedness_records,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    action_plan_records.length === 0 &&
    inhaler_technique_records.length === 0 &&
    trigger_management_records.length === 0 &&
    peak_flow_records.length === 0 &&
    emergency_preparedness_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess asthma and respiratory management.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No asthma or respiratory management data recorded despite children on placement — respiratory health oversight requires urgent attention.",
      ),
      concerns: [
        "No asthma action plans, inhaler technique checks, trigger management records, peak flow monitoring, or emergency preparedness records exist despite children being on placement — the home cannot evidence respiratory health management.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured recording of asthma action plans, inhaler technique assessments, trigger management strategies, peak flow monitoring, and respiratory emergency preparedness to evidence the home's management of children's respiratory health needs.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 14 — Health care",
        },
        {
          rank: 2,
          recommendation:
            "Conduct an immediate review of all children to identify those with asthma or respiratory conditions and ensure every affected child has a current, GP-approved asthma action plan accessible to all staff.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 5 — Engaging and effective leadership",
        },
      ],
      insights: [
        {
          text: "The complete absence of respiratory management records means the home cannot demonstrate that children's asthma and respiratory health needs are being assessed, monitored, or managed. This is a fundamental gap in health care provision under Regulation 14 and presents a risk to children's safety and wellbeing.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- Asthma action plan metrics ---
  const totalActionPlanRecords = action_plan_records.length;

  const plansInPlace = action_plan_records.filter((a) => a.plan_in_place).length;
  const plansCurrent = action_plan_records.filter((a) => a.plan_in_place && a.plan_current).length;
  const plansGpApproved = action_plan_records.filter((a) => a.plan_in_place && a.gp_approved).length;
  const plansAccessible = action_plan_records.filter((a) => a.plan_in_place && a.plan_accessible).length;
  const plansTriggersDocumented = action_plan_records.filter(
    (a) => a.plan_in_place && a.personalised_triggers_documented,
  ).length;
  const plansChildInvolved = action_plan_records.filter(
    (a) => a.plan_in_place && a.child_involved_in_plan,
  ).length;
  const plansSharedWithChild = action_plan_records.filter(
    (a) => a.plan_in_place && a.plan_shared_with_child,
  ).length;

  // Action plan coverage: composite of plan_in_place, plan_current, gp_approved, plan_accessible
  const actionPlanCoverageRate = meanOf([
    rate(plansInPlace, totalActionPlanRecords),
    rate(plansCurrent, totalActionPlanRecords),
    rate(plansGpApproved, totalActionPlanRecords),
    rate(plansAccessible, totalActionPlanRecords),
  ]);

  const gpApprovalRate = rate(plansGpApproved, totalActionPlanRecords);
  const triggersDocumentedRate = rate(plansTriggersDocumented, totalActionPlanRecords);

  // Identify overdue plan reviews
  const overdueReviews = action_plan_records.filter((a) => {
    if (!a.review_due_date) return false;
    return a.review_due_date < today && a.plan_in_place;
  }).length;
  const overdueReviewRate = rate(overdueReviews, totalActionPlanRecords);

  // --- Inhaler technique metrics ---
  const totalInhalerRecords = inhaler_technique_records.length;

  const techniqueCorrect = inhaler_technique_records.filter((i) => i.technique_correct).length;
  const inhalerTechniqueRate = rate(techniqueCorrect, totalInhalerRecords);

  const totalStepsCorrect = inhaler_technique_records.reduce(
    (sum, i) => sum + i.steps_completed_correctly,
    0,
  );
  const totalStepsTotal = inhaler_technique_records.reduce(
    (sum, i) => sum + i.steps_total,
    0,
  );
  const stepCompletionRate = rate(totalStepsCorrect, totalStepsTotal);

  const canSelfAdminister = inhaler_technique_records.filter(
    (i) => i.child_can_self_administer,
  ).length;

  const understandsWhenToUse = inhaler_technique_records.filter(
    (i) => i.child_understands_when_to_use,
  ).length;

  const retrainingNeeded = inhaler_technique_records.filter(
    (i) => i.retraining_needed,
  ).length;
  const retrainingNeededRate = rate(retrainingNeeded, totalInhalerRecords);

  const retrainingProvided = inhaler_technique_records.filter(
    (i) => i.retraining_needed && i.retraining_provided,
  ).length;
  const retrainingProvidedRate = rate(retrainingProvided, retrainingNeeded);

  // Assessor quality — specialist/nurse/pharmacist vs staff
  const specialistAssessments = inhaler_technique_records.filter(
    (i) =>
      i.assessor_role === "nurse" ||
      i.assessor_role === "pharmacist" ||
      i.assessor_role === "respiratory_specialist",
  ).length;
  const specialistAssessmentRate = rate(specialistAssessments, totalInhalerRecords);

  // Overdue technique checks
  const overdueInhalerChecks = inhaler_technique_records.filter((i) => {
    if (!i.next_check_due) return false;
    return i.next_check_due < today;
  }).length;
  const overdueInhalerCheckRate = rate(overdueInhalerChecks, totalInhalerRecords);

  // --- Trigger management metrics ---
  const totalTriggerRecords = trigger_management_records.length;

  const triggersIdentified = trigger_management_records.filter(
    (t) => t.trigger_identified,
  ).length;
  const triggerIdentificationRate = rate(triggersIdentified, totalTriggerRecords);

  const avoidancePlanInPlace = trigger_management_records.filter(
    (t) => t.trigger_identified && t.avoidance_plan_in_place,
  ).length;
  const avoidancePlanRate = rate(avoidancePlanInPlace, triggersIdentified);

  const envControlsImplemented = trigger_management_records.filter(
    (t) => t.environmental_controls_implemented,
  ).length;
  const envControlRate = rate(envControlsImplemented, totalTriggerRecords);

  const childCanIdentify = trigger_management_records.filter(
    (t) => t.child_can_identify_trigger,
  ).length;

  const childCanManageExposure = trigger_management_records.filter(
    (t) => t.child_can_manage_exposure,
  ).length;

  const staffAwareOfTrigger = trigger_management_records.filter(
    (t) => t.staff_aware_of_trigger,
  ).length;
  const staffTriggerAwarenessRate = rate(staffAwareOfTrigger, totalTriggerRecords);

  const documentedInCarePlan = trigger_management_records.filter(
    (t) => t.documented_in_care_plan,
  ).length;
  const triggerDocumentedRate = rate(documentedInCarePlan, totalTriggerRecords);

  const episodesOccurred = trigger_management_records.filter(
    (t) => t.episode_occurred,
  ).length;

  const severeEpisodes = trigger_management_records.filter(
    (t) =>
      t.episode_occurred &&
      (t.episode_severity === "severe" || t.episode_severity === "emergency"),
  ).length;
  const severeEpisodeRate = rate(severeEpisodes, totalTriggerRecords);

  const appropriateActions = trigger_management_records.filter(
    (t) => t.episode_occurred && t.action_taken_appropriate,
  ).length;
  const appropriateActionRate = rate(appropriateActions, episodesOccurred);

  // Composite trigger management rate
  // meanOf already answers null when every component is unmeasured, so the
  // `totalTriggerRecords > 0 ? … : 0` guard is redundant — and its 0 was
  // the fabrication this series exists to remove.
  const triggerManagementRate = meanOf([triggerIdentificationRate, avoidancePlanRate, envControlRate, staffTriggerAwarenessRate, triggerDocumentedRate]);

  // Trigger type distribution
  const triggerTypeCounts: Record<string, number> = {};
  for (const t of trigger_management_records) {
    triggerTypeCounts[t.trigger_type] = (triggerTypeCounts[t.trigger_type] ?? 0) + 1;
  }
  const topTriggers = Object.entries(triggerTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // --- Peak flow monitoring metrics ---
  const totalPeakFlowRecords = peak_flow_records.length;

  const peakFlowTechniqueCorrect = peak_flow_records.filter(
    (p) => p.technique_correct,
  ).length;
  const peakFlowTechniqueRate = rate(peakFlowTechniqueCorrect, totalPeakFlowRecords);

  const peakFlowRecordedInDiary = peak_flow_records.filter(
    (p) => p.recorded_in_diary,
  ).length;
  const diaryRecordingRate = rate(peakFlowRecordedInDiary, totalPeakFlowRecords);

  const peakFlowGreenZone = peak_flow_records.filter(
    (p) => p.zone === "green",
  ).length;
  const greenZoneRate = rate(peakFlowGreenZone, totalPeakFlowRecords);

  const peakFlowAmberZone = peak_flow_records.filter(
    (p) => p.zone === "amber",
  ).length;
  const amberZoneRate = rate(peakFlowAmberZone, totalPeakFlowRecords);

  const peakFlowRedZone = peak_flow_records.filter(
    (p) => p.zone === "red",
  ).length;
  const redZoneRate = rate(peakFlowRedZone, totalPeakFlowRecords);

  const peakFlowIndependent = peak_flow_records.filter(
    (p) => p.child_performed_independently,
  ).length;

  const actionRequired = peak_flow_records.filter(
    (p) => p.action_required,
  ).length;
  const actionTaken = peak_flow_records.filter(
    (p) => p.action_required && p.action_taken,
  ).length;
  const actionTakenRate = rate(actionTaken, actionRequired);

  const decliningTrend = peak_flow_records.filter(
    (p) => p.trend_direction === "declining",
  ).length;
  const decliningRate = rate(decliningTrend, totalPeakFlowRecords);

  const improvingTrend = peak_flow_records.filter(
    (p) => p.trend_direction === "improving",
  ).length;
  const improvingRate = rate(improvingTrend, totalPeakFlowRecords);

  // Peak flow monitoring composite
  const peakFlowMonitoringRate =
    totalPeakFlowRecords > 0
      ? meanOf([peakFlowTechniqueRate, diaryRecordingRate, greenZoneRate, actionTakenRate])
      : null;

  // --- Emergency preparedness metrics ---
  const totalEmergencyRecords = emergency_preparedness_records.length;

  const inhalerAccessible = emergency_preparedness_records.filter(
    (e) => e.emergency_inhaler_accessible,
  ).length;
  const inhalerAccessibleRate = rate(inhalerAccessible, totalEmergencyRecords);

  const protocolDisplayed = emergency_preparedness_records.filter(
    (e) => e.emergency_protocol_displayed,
  ).length;
  const protocolDisplayedRate = rate(protocolDisplayed, totalEmergencyRecords);

  const staffTrainedEmergency = emergency_preparedness_records.filter(
    (e) => e.staff_trained_in_emergency,
  ).length;
  const staffTrainedEmergencyRate = rate(staffTrainedEmergency, totalEmergencyRecords);

  const totalStaffTrained = emergency_preparedness_records.reduce(
    (sum, e) => sum + e.staff_count_trained,
    0,
  );
  const totalStaffCount = emergency_preparedness_records.reduce(
    (sum, e) => sum + e.staff_count_total,
    0,
  );
  const staffTrainingCoverageRate = rate(totalStaffTrained, totalStaffCount);

  const ambulanceProcedureKnown = emergency_preparedness_records.filter(
    (e) => e.ambulance_procedure_known,
  ).length;
  const ambulanceProcedureRate = rate(ambulanceProcedureKnown, totalEmergencyRecords);

  const emergencyContactsCurrent = emergency_preparedness_records.filter(
    (e) => e.emergency_contacts_current,
  ).length;
  const emergencyContactsRate = rate(emergencyContactsCurrent, totalEmergencyRecords);

  const drillsCompleted = emergency_preparedness_records.filter(
    (e) => e.assessment_type === "drill",
  ).length;
  const drillsSuccessful = emergency_preparedness_records.filter(
    (e) => e.assessment_type === "drill" && e.drill_completed_successfully,
  ).length;
  const drillSuccessRate = rate(drillsSuccessful, drillsCompleted);

  // Emergency preparedness composite
  // meanOf already answers null when every component is unmeasured, so the
  // `totalEmergencyRecords > 0 ? … : 0` guard is redundant — and its 0 was
  // the fabrication this series exists to remove.
  const emergencyPreparednessRate = meanOf([inhalerAccessibleRate, staffTrainedEmergencyRate, protocolDisplayedRate, emergencyContactsRate, ambulanceProcedureRate]);

  // --- Child self-management composite ---
  // Draws from: child_involved_in_plan, child_can_self_administer,
  // child_can_identify_trigger, child_can_manage_exposure,
  // child_performed_independently (peak flow), plan_shared_with_child

  const selfMgmtNumerators: number[] = [];
  const selfMgmtDenominators: number[] = [];

  if (totalActionPlanRecords > 0) {
    selfMgmtNumerators.push(plansChildInvolved);
    selfMgmtDenominators.push(totalActionPlanRecords);
    selfMgmtNumerators.push(plansSharedWithChild);
    selfMgmtDenominators.push(totalActionPlanRecords);
  }
  if (totalInhalerRecords > 0) {
    selfMgmtNumerators.push(canSelfAdminister);
    selfMgmtDenominators.push(totalInhalerRecords);
    selfMgmtNumerators.push(understandsWhenToUse);
    selfMgmtDenominators.push(totalInhalerRecords);
  }
  if (totalTriggerRecords > 0) {
    selfMgmtNumerators.push(childCanIdentify);
    selfMgmtDenominators.push(totalTriggerRecords);
    selfMgmtNumerators.push(childCanManageExposure);
    selfMgmtDenominators.push(totalTriggerRecords);
  }
  if (totalPeakFlowRecords > 0) {
    selfMgmtNumerators.push(peakFlowIndependent);
    selfMgmtDenominators.push(totalPeakFlowRecords);
  }

  const totalSelfMgmtNum = selfMgmtNumerators.reduce((a, b) => a + b, 0);
  const totalSelfMgmtDenom = selfMgmtDenominators.reduce((a, b) => a + b, 0);
  const childSelfManagementRate = rate(totalSelfMgmtNum, totalSelfMgmtDenom);

  // ── Scoring: base 52 ─────────────────────────────────────────────────

  let score = 52;

  // --- Bonus 1: actionPlanCoverageRate (>=90: +5, >=70: +3) ---
  if (meets(actionPlanCoverageRate, 90)) score += 5;
  else if (meets(actionPlanCoverageRate, 70)) score += 3;

  // --- Bonus 2: inhalerTechniqueRate (>=95: +5, >=80: +3) ---
  if (meets(inhalerTechniqueRate, 95)) score += 5;
  else if (meets(inhalerTechniqueRate, 80)) score += 3;

  // --- Bonus 3: triggerManagementRate (>=85: +4, >=65: +2) ---
  if (meets(triggerManagementRate, 85)) score += 4;
  else if (meets(triggerManagementRate, 65)) score += 2;

  // --- Bonus 4: peakFlowMonitoringRate (>=85: +4, >=65: +2) ---
  if ((peakFlowMonitoringRate ?? 0) >= 85) score += 4;
  else if ((peakFlowMonitoringRate ?? 0) >= 65) score += 2;

  // --- Bonus 5: emergencyPreparednessRate (>=90: +5, >=75: +3) ---
  if (meets(emergencyPreparednessRate, 90)) score += 5;
  else if (meets(emergencyPreparednessRate, 75)) score += 3;

  // --- Bonus 6: childSelfManagementRate (>=85: +3, >=65: +1) ---
  if (meets(childSelfManagementRate, 85)) score += 3;
  else if (meets(childSelfManagementRate, 65)) score += 1;

  // --- Bonus 7: staffTrainingCoverageRate (>=90: +2, >=70: +1) ---
  if (meets(staffTrainingCoverageRate, 90)) score += 2;
  else if (meets(staffTrainingCoverageRate, 70)) score += 1;

  // ── Penalties ─────────────────────────────────────────────────────────

  // actionPlanCoverageRate < 40 → -6 (guarded)
  if (below(actionPlanCoverageRate, 40) && action_plan_records.length > 0) score -= 6;

  // inhalerTechniqueRate < 50 → -5 (guarded)
  if (below(inhalerTechniqueRate, 50) && inhaler_technique_records.length > 0) score -= 5;

  // emergencyPreparednessRate < 40 → -5 (guarded)
  if (below(emergencyPreparednessRate, 40) && emergency_preparedness_records.length > 0) score -= 5;

  // redZoneRate > 30 → -4 (guarded)
  if (above(redZoneRate, 30) && peak_flow_records.length > 0) score -= 4;

  score = clamp(score, 0, 100);

  const respiratory_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (meets(actionPlanCoverageRate, 90) && totalActionPlanRecords > 0) {
    strengths.push(
      `${actionPlanCoverageRate}% asthma action plan coverage — comprehensive plans are in place, current, GP-approved, and accessible, ensuring every child's respiratory needs are systematically managed.`,
    );
  } else if (meets(actionPlanCoverageRate, 70) && totalActionPlanRecords > 0) {
    strengths.push(
      `${actionPlanCoverageRate}% action plan coverage — the home maintains good asthma action plan provision with most plans current and approved.`,
    );
  }

  if (meets(inhalerTechniqueRate, 95) && totalInhalerRecords > 0) {
    strengths.push(
      `${inhalerTechniqueRate}% correct inhaler technique — children demonstrate excellent inhaler competency, ensuring medication is delivered effectively.`,
    );
  } else if (meets(inhalerTechniqueRate, 80) && totalInhalerRecords > 0) {
    strengths.push(
      `${inhalerTechniqueRate}% inhaler technique accuracy — good levels of inhaler competency across assessed children.`,
    );
  }

  if (meets(triggerManagementRate, 85) && totalTriggerRecords > 0) {
    strengths.push(
      `${triggerManagementRate}% trigger management rate — triggers are well-identified, avoidance plans are in place, and environmental controls are effectively implemented.`,
    );
  } else if (meets(triggerManagementRate, 65) && totalTriggerRecords > 0) {
    strengths.push(
      `${triggerManagementRate}% trigger management effectiveness — the home has reasonable trigger identification and avoidance strategies in place.`,
    );
  }

  if ((peakFlowMonitoringRate ?? 0) >= 85 && totalPeakFlowRecords > 0) {
    strengths.push(
      `${peakFlowMonitoringRate}% peak flow monitoring quality — consistent technique, diary recording, and appropriate action when readings deteriorate.`,
    );
  } else if ((peakFlowMonitoringRate ?? 0) >= 65 && totalPeakFlowRecords > 0) {
    strengths.push(
      `${peakFlowMonitoringRate}% peak flow monitoring rate — the home maintains reasonable peak flow monitoring practices.`,
    );
  }

  if (meets(emergencyPreparednessRate, 90) && totalEmergencyRecords > 0) {
    strengths.push(
      `${emergencyPreparednessRate}% emergency preparedness — emergency inhalers are accessible, staff are trained, protocols are displayed, and emergency contacts are current.`,
    );
  } else if (meets(emergencyPreparednessRate, 75) && totalEmergencyRecords > 0) {
    strengths.push(
      `${emergencyPreparednessRate}% emergency preparedness rate — the home has good respiratory emergency arrangements in place.`,
    );
  }

  if (meets(childSelfManagementRate, 85) && totalSelfMgmtDenom > 0) {
    strengths.push(
      `${childSelfManagementRate}% child self-management capability — children are actively involved in managing their own respiratory health, demonstrating excellent empowerment and health literacy.`,
    );
  } else if (meets(childSelfManagementRate, 65) && totalSelfMgmtDenom > 0) {
    strengths.push(
      `${childSelfManagementRate}% child self-management rate — good levels of children's involvement in their own respiratory health management.`,
    );
  }

  if (meets(staffTrainingCoverageRate, 90) && totalStaffCount > 0) {
    strengths.push(
      `${staffTrainingCoverageRate}% staff trained in respiratory emergency response — virtually all staff are equipped to respond to asthma emergencies.`,
    );
  } else if (meets(staffTrainingCoverageRate, 70) && totalStaffCount > 0) {
    strengths.push(
      `${staffTrainingCoverageRate}% staff training coverage for respiratory emergencies — good levels of preparedness across the staff team.`,
    );
  }

  if (meets(gpApprovalRate, 95) && totalActionPlanRecords > 0) {
    strengths.push(
      `${gpApprovalRate}% of action plans are GP-approved — excellent clinical oversight ensuring plans are medically sound and appropriate.`,
    );
  }

  if (meets(greenZoneRate, 80) && totalPeakFlowRecords > 0) {
    strengths.push(
      `${greenZoneRate}% of peak flow readings in the green zone — the majority of children demonstrate well-controlled asthma.`,
    );
  }

  if (meets(appropriateActionRate, 95) && episodesOccurred > 0) {
    strengths.push(
      `${appropriateActionRate}% of respiratory episodes managed with appropriate action — staff respond effectively when children experience asthma symptoms.`,
    );
  } else if (meets(appropriateActionRate, 80) && episodesOccurred > 0) {
    strengths.push(
      `${appropriateActionRate}% appropriate response rate during respiratory episodes — the home generally manages asthma events well.`,
    );
  }

  if (meets(retrainingProvidedRate, 95) && retrainingNeeded > 0) {
    strengths.push(
      "Retraining is consistently provided when inhaler technique deficiencies are identified — demonstrating responsive and proactive health care management.",
    );
  }

  if (meets(drillSuccessRate, 90) && drillsCompleted > 0) {
    strengths.push(
      `${drillSuccessRate}% of respiratory emergency drills completed successfully — the home is well-rehearsed in managing asthma emergencies.`,
    );
  }

  if (meets(actionTakenRate, 95) && actionRequired > 0) {
    strengths.push(
      `${actionTakenRate}% of peak flow readings requiring action received appropriate response — demonstrating excellent monitoring-to-action responsiveness.`,
    );
  }

  if (meets(triggersDocumentedRate, 95) && totalTriggerRecords > 0) {
    strengths.push(
      `${triggersDocumentedRate}% of triggers documented in care plans — trigger management is embedded within care planning, ensuring consistency and continuity.`,
    );
  }

  if (meets(specialistAssessmentRate, 80) && totalInhalerRecords > 0) {
    strengths.push(
      `${specialistAssessmentRate}% of inhaler technique assessments conducted by healthcare professionals — high-quality clinical oversight of inhaler competency.`,
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (below(actionPlanCoverageRate, 40) && totalActionPlanRecords > 0) {
    concerns.push(
      `Only ${actionPlanCoverageRate}% asthma action plan coverage — many plans are absent, outdated, not GP-approved, or inaccessible, meaning children's respiratory needs may not be safely managed. This is a significant Regulation 14 concern.`,
    );
  } else if (below(actionPlanCoverageRate, 70) && meets(actionPlanCoverageRate, 40) && totalActionPlanRecords > 0) {
    concerns.push(
      `Action plan coverage at ${actionPlanCoverageRate}% — gaps in plan currency, GP approval, or accessibility mean some children's respiratory health is not comprehensively managed.`,
    );
  }

  if (below(inhalerTechniqueRate, 50) && totalInhalerRecords > 0) {
    concerns.push(
      `Only ${inhalerTechniqueRate}% correct inhaler technique — the majority of children are not using inhalers correctly, meaning medication may not be effectively delivered. This directly impacts children's respiratory health and safety.`,
    );
  } else if (below(inhalerTechniqueRate, 80) && meets(inhalerTechniqueRate, 50) && totalInhalerRecords > 0) {
    concerns.push(
      `Inhaler technique accuracy at ${inhalerTechniqueRate}% — a significant number of children are not demonstrating correct technique, reducing medication effectiveness.`,
    );
  }

  if (below(triggerManagementRate, 40) && totalTriggerRecords > 0) {
    concerns.push(
      `Only ${triggerManagementRate}% trigger management effectiveness — triggers are poorly identified, avoidance plans are inadequate, and environmental controls are not effectively implemented, leaving children exposed to preventable respiratory episodes.`,
    );
  } else if (below(triggerManagementRate, 65) && meets(triggerManagementRate, 40) && totalTriggerRecords > 0) {
    concerns.push(
      `Trigger management at ${triggerManagementRate}% — inconsistent identification, avoidance planning, or environmental control of respiratory triggers requires improvement.`,
    );
  }

  if ((peakFlowMonitoringRate ?? 0) < 40 && totalPeakFlowRecords > 0) {
    concerns.push(
      `Only ${peakFlowMonitoringRate}% peak flow monitoring quality — poor technique, inconsistent diary recording, or failure to act on abnormal readings means children's respiratory status is not being effectively tracked.`,
    );
  } else if ((peakFlowMonitoringRate ?? 0) < 65 && (peakFlowMonitoringRate ?? 0) >= 40 && totalPeakFlowRecords > 0) {
    concerns.push(
      `Peak flow monitoring at ${peakFlowMonitoringRate}% — monitoring consistency, recording, or response to abnormal readings requires improvement.`,
    );
  }

  if (below(emergencyPreparednessRate, 40) && totalEmergencyRecords > 0) {
    concerns.push(
      `Only ${emergencyPreparednessRate}% emergency preparedness — critical gaps in emergency inhaler access, staff training, protocol display, or emergency contacts present a serious risk to children's safety during asthma emergencies.`,
    );
  } else if (below(emergencyPreparednessRate, 75) && meets(emergencyPreparednessRate, 40) && totalEmergencyRecords > 0) {
    concerns.push(
      `Emergency preparedness at ${emergencyPreparednessRate}% — gaps in equipment access, staff training, or emergency procedures need attention to ensure safe management of respiratory emergencies.`,
    );
  }

  if (below(childSelfManagementRate, 30) && totalSelfMgmtDenom > 0) {
    concerns.push(
      `Only ${childSelfManagementRate}% child self-management capability — children are not being supported to understand and manage their own respiratory health, missing opportunities for empowerment and independence.`,
    );
  } else if (below(childSelfManagementRate, 65) && meets(childSelfManagementRate, 30) && totalSelfMgmtDenom > 0) {
    concerns.push(
      `Child self-management at ${childSelfManagementRate}% — many children are not yet able to identify their triggers, self-administer medication, or monitor their own peak flow independently.`,
    );
  }

  if (above(redZoneRate, 30) && totalPeakFlowRecords > 0) {
    concerns.push(
      `${redZoneRate}% of peak flow readings in the red zone — a high proportion of readings indicate severely compromised respiratory function. Urgent clinical review is needed for affected children.`,
    );
  } else if (above(redZoneRate, 15) && (redZoneRate !== null && redZoneRate <= 30) && totalPeakFlowRecords > 0) {
    concerns.push(
      `${redZoneRate}% of peak flow readings in the red zone — a notable proportion of readings indicate poor respiratory control, warranting clinical review and action plan reassessment.`,
    );
  }

  if (above(overdueReviewRate, 30) && totalActionPlanRecords > 0) {
    concerns.push(
      `${overdueReviewRate}% of asthma action plans overdue for review — overdue plans may contain outdated medication details or inappropriate emergency steps, compromising children's safety.`,
    );
  } else if (above(overdueReviewRate, 10) && (overdueReviewRate !== null && overdueReviewRate <= 30) && totalActionPlanRecords > 0) {
    concerns.push(
      `${overdueReviewRate}% of action plans overdue for review — some plans need timely updating to ensure they reflect current health needs and medication regimens.`,
    );
  }

  if (above(retrainingNeededRate, 40) && totalInhalerRecords > 0) {
    concerns.push(
      `${retrainingNeededRate}% of inhaler technique assessments identified retraining needs — a high proportion of children require technique correction, suggesting initial training may be insufficient.`,
    );
  }

  if (below(retrainingProvidedRate, 70) && retrainingNeeded > 0) {
    concerns.push(
      `Only ${retrainingProvidedRate}% of identified retraining needs have been addressed — children who need inhaler technique correction are not receiving it, meaning poor technique persists.`,
    );
  }

  if (above(overdueInhalerCheckRate, 20) && totalInhalerRecords > 0) {
    concerns.push(
      `${overdueInhalerCheckRate}% of inhaler technique checks are overdue — technique can deteriorate over time and must be regularly assessed to ensure effective medication delivery.`,
    );
  }

  if (below(staffTrainingCoverageRate, 50) && totalStaffCount > 0) {
    concerns.push(
      `Only ${staffTrainingCoverageRate}% of staff trained in respiratory emergency response — insufficient training coverage means not all shifts may have a staff member capable of managing an asthma emergency.`,
    );
  }

  if (above(severeEpisodeRate, 20) && totalTriggerRecords > 0) {
    concerns.push(
      `${severeEpisodeRate}% of respiratory episodes classified as severe or emergency — a high rate of serious episodes suggests trigger management and preventive measures are not effective enough.`,
    );
  }

  if (below(appropriateActionRate, 80) && episodesOccurred > 0) {
    concerns.push(
      `Only ${appropriateActionRate}% of respiratory episodes received appropriate action — some asthma events are not being managed correctly, presenting a direct risk to children's health and safety.`,
    );
  }

  if (below(actionTakenRate, 70) && actionRequired > 0) {
    concerns.push(
      `Only ${actionTakenRate}% of peak flow readings requiring action received a response — abnormal readings are not consistently triggering the intervention steps outlined in action plans.`,
    );
  }

  if (above(decliningRate, 25) && totalPeakFlowRecords > 0) {
    concerns.push(
      `${decliningRate}% of peak flow records show a declining trend — worsening respiratory function across multiple readings requires clinical review and potential treatment adjustment.`,
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: AsthmaRespiratoryRecommendation[] = [];
  let rank = 0;

  if (below(actionPlanCoverageRate, 40) && totalActionPlanRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review all asthma action plans — ensure every child with asthma has a current, GP-approved, accessible plan that includes personalised triggers, medication details, and emergency steps. Brief all staff on each child's plan immediately.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (below(inhalerTechniqueRate, 50) && totalInhalerRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Arrange immediate inhaler technique retraining for all children — poor technique means medication is not reaching the lungs effectively. Request assessment by a respiratory nurse or pharmacist and implement regular technique checks.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (below(emergencyPreparednessRate, 40) && totalEmergencyRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Address critical gaps in respiratory emergency preparedness — ensure emergency inhalers and spacers are immediately accessible, all staff are trained in asthma first aid, emergency protocols are displayed, and emergency contacts are verified and current.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (above(redZoneRate, 30) && totalPeakFlowRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Refer all children with red-zone peak flow readings for urgent clinical review — a high proportion of readings indicate severely compromised respiratory function requiring immediate medical assessment and possible treatment escalation.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (below(triggerManagementRate, 40) && totalTriggerRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Overhaul trigger management across the home — ensure all known triggers are identified, documented in care plans, and have specific avoidance strategies with environmental controls. Train staff on each child's trigger profile.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (below(staffTrainingCoverageRate, 50) && totalStaffCount > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently increase staff asthma emergency training coverage — ensure every shift has at least one member of staff trained in asthma first aid, use of emergency inhalers/spacers, and when to call an ambulance.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging and effective leadership",
    });
  }

  if (below(appropriateActionRate, 80) && episodesOccurred > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review all respiratory episodes where action was not appropriate — identify training gaps, update action plans, and implement post-incident debriefs to ensure every asthma event is managed safely.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (below(retrainingProvidedRate, 70) && retrainingNeeded > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure identified inhaler technique retraining needs are acted on promptly — schedule retraining sessions within 2 weeks of identification and track completion to prevent children continuing with poor technique.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (below(childSelfManagementRate, 30) && totalSelfMgmtDenom > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop a structured self-management education programme for children — teach trigger recognition, inhaler technique, peak flow monitoring, and when to seek help, tailored to each child's age and understanding.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Health and wellbeing",
    });
  }

  if (
    meets(actionPlanCoverageRate, 40) &&
    below(actionPlanCoverageRate, 70) &&
    totalActionPlanRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve action plan coverage by ensuring all plans are current, GP-approved, and accessible — review each plan's currency, arrange GP sign-off where needed, and verify staff can locate and follow every child's plan.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (
    meets(inhalerTechniqueRate, 50) &&
    below(inhalerTechniqueRate, 80) &&
    totalInhalerRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Arrange regular inhaler technique reviews with healthcare professionals — schedule at least quarterly assessments and provide immediate retraining when technique deficiencies are identified.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (
    meets(triggerManagementRate, 40) &&
    below(triggerManagementRate, 65) &&
    totalTriggerRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen trigger management by reviewing avoidance plans and environmental controls — ensure all identified triggers have documented avoidance strategies and that staff and children are aware of each child's trigger profile.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (
    (peakFlowMonitoringRate ?? 0) >= 40 &&
    (peakFlowMonitoringRate ?? 0) < 65 &&
    totalPeakFlowRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve peak flow monitoring consistency — ensure correct technique, daily diary recording, and clear escalation pathways when readings enter amber or red zones.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (
    meets(emergencyPreparednessRate, 40) &&
    below(emergencyPreparednessRate, 75) &&
    totalEmergencyRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen respiratory emergency preparedness — conduct regular equipment checks, schedule staff refresher training, ensure protocols are prominently displayed, and run practice drills at least quarterly.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging and effective leadership",
    });
  }

  if (
    meets(childSelfManagementRate, 30) &&
    below(childSelfManagementRate, 65) &&
    totalSelfMgmtDenom > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Support more children to develop self-management skills — work with each child on understanding their condition, recognising symptoms, using their inhaler correctly, and knowing when to escalate concerns.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Health and wellbeing",
    });
  }

  if (above(overdueReviewRate, 10) && totalActionPlanRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Schedule overdue action plan reviews immediately — plans must be reviewed at least annually or when a child's condition changes, with GP input, to ensure medication and emergency steps remain appropriate.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (below(actionTakenRate, 70) && actionRequired > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all abnormal peak flow readings trigger the appropriate action plan response — train staff to act on amber and red zone readings immediately and document all interventions taken.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (
    meets(staffTrainingCoverageRate, 50) &&
    below(staffTrainingCoverageRate, 70) &&
    totalStaffCount > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase staff training coverage for respiratory emergencies to at least 70% — schedule additional training sessions and ensure new starters receive asthma awareness as part of induction.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging and effective leadership",
    });
  }

  if (below(specialistAssessmentRate, 50) && totalInhalerRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase the proportion of inhaler technique assessments conducted by healthcare professionals — while staff observations are valuable, regular specialist assessment ensures technique is evaluated to clinical standards.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (
    above(redZoneRate, 15) &&
    (redZoneRate !== null && redZoneRate <= 30) &&
    totalPeakFlowRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review children with red-zone peak flow readings with their GP or respiratory specialist — persistent red-zone readings indicate poorly controlled asthma that may require treatment adjustment.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (
    above(decliningRate, 25) &&
    totalPeakFlowRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Investigate declining peak flow trends — identify whether declining readings correlate with trigger exposure, medication non-compliance, or seasonal factors, and escalate to clinical teams for review.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: AsthmaRespiratoryInsight[] = [];

  // -- Critical insights --

  if (below(actionPlanCoverageRate, 40) && totalActionPlanRecords > 0) {
    insights.push({
      text: `Only ${actionPlanCoverageRate}% asthma action plan coverage. Without current, approved, accessible action plans, staff may not know how to manage a child's asthma on a day-to-day basis or in an emergency. This presents a direct risk under Regulation 14 and must be addressed urgently.`,
      severity: "critical",
    });
  }

  if (below(inhalerTechniqueRate, 50) && totalInhalerRecords > 0) {
    insights.push({
      text: `Only ${inhalerTechniqueRate}% correct inhaler technique. Incorrect technique means reliever and preventer medication is not reaching the airways effectively — children may experience more symptoms, more exacerbations, and more emergency events as a direct consequence of poor technique.`,
      severity: "critical",
    });
  }

  if (below(emergencyPreparednessRate, 40) && totalEmergencyRecords > 0) {
    insights.push({
      text: `Only ${emergencyPreparednessRate}% emergency preparedness. Critical gaps in emergency equipment, staff training, or procedures mean the home may not be able to respond safely to a severe asthma attack. An asthma attack can become life-threatening within minutes — preparedness is not optional.`,
      severity: "critical",
    });
  }

  if (above(redZoneRate, 30) && totalPeakFlowRecords > 0) {
    insights.push({
      text: `${redZoneRate}% of peak flow readings in the red zone. A high proportion of red-zone readings indicates that multiple children's asthma is severely uncontrolled. This requires immediate clinical escalation — red-zone readings signal that a child may be at risk of a serious or life-threatening asthma attack.`,
      severity: "critical",
    });
  }

  if (below(staffTrainingCoverageRate, 50) && totalStaffCount > 0) {
    insights.push({
      text: `Only ${staffTrainingCoverageRate}% of staff trained in respiratory emergency response. Asthma emergencies can occur at any time — if the staff member on duty has not been trained, the delay in responding could be life-threatening. Every shift must have trained staff.`,
      severity: "critical",
    });
  }

  if (totalActionPlanRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No asthma action plan records despite children being on placement. Even if no children currently have asthma, the home should have processes in place to identify and plan for respiratory needs. If any child does have asthma, the absence of an action plan is a serious Regulation 14 failure.",
      severity: "critical",
    });
  }

  if (totalEmergencyRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No respiratory emergency preparedness records. Regardless of current diagnoses, the home should maintain basic respiratory emergency readiness including accessible emergency inhalers, trained staff, and displayed protocols. Asthma can present for the first time at any age.",
      severity: "critical",
    });
  }

  if (above(severeEpisodeRate, 20) && totalTriggerRecords > 0) {
    insights.push({
      text: `${severeEpisodeRate}% of respiratory episodes are severe or emergency-level. A high rate of serious events suggests that preventive management — trigger avoidance, medication compliance, early intervention — is not working effectively. Each severe episode represents a significant risk to the child.`,
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (
    meets(actionPlanCoverageRate, 40) &&
    below(actionPlanCoverageRate, 70) &&
    totalActionPlanRecords > 0
  ) {
    insights.push({
      text: `Action plan coverage at ${actionPlanCoverageRate}% — while plans exist, gaps in currency, GP approval, or accessibility mean some children's respiratory needs are not fully managed. Consistent, comprehensive plans are the foundation of safe asthma care.`,
      severity: "warning",
    });
  }

  if (
    meets(inhalerTechniqueRate, 50) &&
    below(inhalerTechniqueRate, 80) &&
    totalInhalerRecords > 0
  ) {
    insights.push({
      text: `Inhaler technique at ${inhalerTechniqueRate}% — while improving, a significant minority of children are not using inhalers correctly. Even small technique errors can substantially reduce medication delivery. Regular assessment and retraining is essential.`,
      severity: "warning",
    });
  }

  if (
    meets(triggerManagementRate, 40) &&
    below(triggerManagementRate, 65) &&
    totalTriggerRecords > 0
  ) {
    insights.push({
      text: `Trigger management at ${triggerManagementRate}% — inconsistencies in trigger identification, avoidance planning, or environmental controls mean some children remain unnecessarily exposed to respiratory triggers. Strengthening this area could significantly reduce episodes.`,
      severity: "warning",
    });
  }

  if (
    (peakFlowMonitoringRate ?? 0) >= 40 &&
    (peakFlowMonitoringRate ?? 0) < 65 &&
    totalPeakFlowRecords > 0
  ) {
    insights.push({
      text: `Peak flow monitoring quality at ${peakFlowMonitoringRate}% — inconsistent technique, recording, or response to abnormal readings reduces the value of monitoring. Peak flow is only useful if it is done correctly and acted upon.`,
      severity: "warning",
    });
  }

  if (
    meets(emergencyPreparednessRate, 40) &&
    below(emergencyPreparednessRate, 75) &&
    totalEmergencyRecords > 0
  ) {
    insights.push({
      text: `Emergency preparedness at ${emergencyPreparednessRate}% — while some arrangements are in place, gaps in equipment, training, or procedures could compromise the home's ability to respond safely to a severe asthma event.`,
      severity: "warning",
    });
  }

  if (
    meets(childSelfManagementRate, 30) &&
    below(childSelfManagementRate, 65) &&
    totalSelfMgmtDenom > 0
  ) {
    insights.push({
      text: `Child self-management capability at ${childSelfManagementRate}% — many children are not yet able to independently manage their respiratory health. Supporting children to understand their condition and develop self-management skills is important for both safety and independence.`,
      severity: "warning",
    });
  }

  if (
    above(overdueReviewRate, 10) &&
    (overdueReviewRate !== null && overdueReviewRate <= 30) &&
    totalActionPlanRecords > 0
  ) {
    insights.push({
      text: `${overdueReviewRate}% of action plans overdue for review. Plans that are not regularly reviewed may contain outdated medication dosages, wrong emergency contacts, or fail to reflect changes in a child's condition. This creates a gap between the plan and the child's actual needs.`,
      severity: "warning",
    });
  }

  if (
    above(retrainingNeededRate, 40) &&
    totalInhalerRecords > 0
  ) {
    insights.push({
      text: `${retrainingNeededRate}% of inhaler assessments identified retraining needs — this high rate suggests initial training may not be thorough enough, or that skills deteriorate between checks. Consider more frequent assessments and practical demonstrations.`,
      severity: "warning",
    });
  }

  if (
    above(redZoneRate, 15) &&
    (redZoneRate !== null && redZoneRate <= 30) &&
    totalPeakFlowRecords > 0
  ) {
    insights.push({
      text: `${redZoneRate}% of peak flow readings in the red zone — while not at critical levels, a notable proportion of children are showing signs of poorly controlled asthma. Clinical review should be arranged for affected children.`,
      severity: "warning",
    });
  }

  if (
    above(amberZoneRate, 40) &&
    totalPeakFlowRecords > 0
  ) {
    insights.push({
      text: `${amberZoneRate}% of peak flow readings in the amber zone — a high proportion of readings in the caution zone suggests asthma is not optimally controlled for many children. Review medication compliance and trigger management.`,
      severity: "warning",
    });
  }

  if (
    above(decliningRate, 15) &&
    (decliningRate !== null && decliningRate <= 25) &&
    totalPeakFlowRecords > 0
  ) {
    insights.push({
      text: `${decliningRate}% of peak flow records show a declining trend — worsening readings across multiple children may indicate seasonal triggers, medication issues, or environmental factors that need investigation.`,
      severity: "warning",
    });
  }

  // Trigger type analysis
  if (topTriggers.length > 0 && totalTriggerRecords > 5) {
    const triggerSummary = topTriggers
      .map(([type, count]) => `${type.replace(/_/g, " ")} (${count})`)
      .join(", ");
    const uncontrolledTriggers = trigger_management_records.filter(
      (t) => t.trigger_identified && !t.avoidance_plan_effective,
    ).length;
    if (uncontrolledTriggers > 0) {
      insights.push({
        text: `Most common triggers: ${triggerSummary}. ${uncontrolledTriggers} identified trigger${uncontrolledTriggers !== 1 ? "s" : ""} lack${uncontrolledTriggers === 1 ? "s" : ""} an effective avoidance plan — targeted environmental controls for these specific triggers could reduce episodes.`,
        severity: "warning",
      });
    }
  }

  if (
    meets(staffTrainingCoverageRate, 50) &&
    below(staffTrainingCoverageRate, 70) &&
    totalStaffCount > 0
  ) {
    insights.push({
      text: `Staff respiratory emergency training at ${staffTrainingCoverageRate}% — while most shifts likely have a trained member, gaps in coverage remain. All staff should be trained to ensure safe response regardless of who is on duty.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (respiratory_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding asthma and respiratory management — action plans are comprehensive, inhaler technique is excellent, triggers are well-managed, peak flow is consistently monitored, and emergency preparedness is thorough. Children's respiratory health is proactively managed with strong evidence of quality care under Regulation 14.",
      severity: "positive",
    });
  }

  if (
    meets(actionPlanCoverageRate, 90) &&
    meets(gpApprovalRate, 95) &&
    totalActionPlanRecords > 0
  ) {
    insights.push({
      text: `${actionPlanCoverageRate}% action plan coverage with ${gpApprovalRate}% GP approval — every child's respiratory needs are formally documented, clinically validated, and accessible to staff. This is the gold standard for asthma action plan management in residential care.`,
      severity: "positive",
    });
  }

  if (
    meets(inhalerTechniqueRate, 95) &&
    meets(stepCompletionRate, 95) &&
    totalInhalerRecords > 0
  ) {
    insights.push({
      text: `${inhalerTechniqueRate}% correct inhaler technique with ${stepCompletionRate}% step completion — children are demonstrating excellent inhaler competency, meaning medication is being delivered effectively and respiratory control is optimised.`,
      severity: "positive",
    });
  }

  if (
    meets(triggerManagementRate, 85) &&
    meets(staffTriggerAwarenessRate, 90) &&
    totalTriggerRecords > 0
  ) {
    insights.push({
      text: `${triggerManagementRate}% trigger management with ${staffTriggerAwarenessRate}% staff awareness — triggers are well-identified, documented, and managed with effective environmental controls. Staff knowledge of each child's triggers is excellent.`,
      severity: "positive",
    });
  }

  if (
    (peakFlowMonitoringRate ?? 0) >= 85 &&
    meets(greenZoneRate, 80) &&
    totalPeakFlowRecords > 0
  ) {
    insights.push({
      text: `${peakFlowMonitoringRate}% peak flow monitoring quality with ${greenZoneRate}% green-zone readings — consistent monitoring, good technique, and proactive response to abnormal readings are keeping children's asthma well-controlled.`,
      severity: "positive",
    });
  }

  if (
    meets(emergencyPreparednessRate, 90) &&
    meets(staffTrainingCoverageRate, 90) &&
    totalEmergencyRecords > 0
  ) {
    insights.push({
      text: `${emergencyPreparednessRate}% emergency preparedness with ${staffTrainingCoverageRate}% staff training coverage — the home is exceptionally well-prepared to manage respiratory emergencies safely. Equipment is accessible, protocols are displayed, and staff are comprehensively trained.`,
      severity: "positive",
    });
  }

  if (
    meets(childSelfManagementRate, 85) &&
    totalSelfMgmtDenom > 0
  ) {
    insights.push({
      text: `${childSelfManagementRate}% child self-management capability — children understand their condition, can use their inhalers correctly, recognise their triggers, and monitor their own respiratory health. This demonstrates outstanding health empowerment and prepares children for independent living.`,
      severity: "positive",
    });
  }

  if (
    meets(appropriateActionRate, 95) &&
    episodesOccurred > 0 &&
    meets(actionTakenRate, 95) &&
    actionRequired > 0
  ) {
    insights.push({
      text: `${appropriateActionRate}% appropriate episode response and ${actionTakenRate}% peak flow action response rate — the home demonstrates consistently excellent responsive care, acting promptly and correctly when children's respiratory health requires intervention.`,
      severity: "positive",
    });
  }

  if (
    meets(drillSuccessRate, 90) &&
    drillsCompleted >= 2
  ) {
    insights.push({
      text: `${drillSuccessRate}% respiratory emergency drill success rate across ${drillsCompleted} drills — regular practice ensures the team can respond effectively under pressure, reducing response times and improving outcomes in real emergencies.`,
      severity: "positive",
    });
  }

  if (
    meets(retrainingProvidedRate, 95) &&
    retrainingNeeded > 0
  ) {
    insights.push({
      text: "Inhaler technique retraining is consistently delivered when needed — the home demonstrates a responsive approach to maintaining children's inhaler competency, ensuring that identified technique issues are promptly corrected.",
      severity: "positive",
    });
  }

  if (
    meets(improvingRate, 40) &&
    totalPeakFlowRecords > 0
  ) {
    insights.push({
      text: `${improvingRate}% of peak flow records show an improving trend — positive trajectory suggests that current management strategies, including medication, trigger avoidance, and monitoring, are having a beneficial impact on children's respiratory health.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (respiratory_rating === "outstanding") {
    headline =
      "Outstanding asthma and respiratory management — action plans are comprehensive, inhaler technique is excellent, triggers are well-managed, peak flow is consistently monitored, and emergency preparedness is thorough.";
  } else if (respiratory_rating === "good") {
    headline = `Good asthma and respiratory management — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (respiratory_rating === "adequate") {
    headline = `Adequate asthma and respiratory management — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure effective respiratory health care for all children.`;
  } else {
    headline = `Asthma and respiratory management is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure children's respiratory health needs are safely managed.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    respiratory_rating,
    respiratory_score: score,
    headline,
    total_action_plan_records: totalActionPlanRecords,
    total_inhaler_technique_records: totalInhalerRecords,
    total_trigger_management_records: totalTriggerRecords,
    total_peak_flow_records: totalPeakFlowRecords,
    total_emergency_preparedness_records: totalEmergencyRecords,
    action_plan_coverage_rate: actionPlanCoverageRate,
    inhaler_technique_rate: inhalerTechniqueRate,
    trigger_management_rate: triggerManagementRate,
    peak_flow_monitoring_rate: peakFlowMonitoringRate,
    emergency_preparedness_rate: emergencyPreparednessRate,
    child_self_management_rate: childSelfManagementRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
