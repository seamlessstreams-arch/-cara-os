// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME HAZARD IDENTIFICATION & NEAR MISS REPORTING INTELLIGENCE ENGINE
// Monitors safety reporting culture — hazard identification and reporting rates,
// near-miss tracking, corrective action effectiveness, safety walk compliance,
// and learning from incidents.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 25 (Premises — premises and grounds managed to minimise hazards),
// Reg 5 (Registered person — duty to manage the home), SCCIF safety indicators.
// Store keys: hazardReportRecords, nearMissRecords, correctiveActionRecords,
//             safetyWalkRecords, incidentLearningRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface HazardReportRecordInput {
  id: string;
  reported_by: string;
  reporter_role: "staff" | "child" | "visitor" | "contractor" | "manager" | "other";
  date_reported: string;
  location: string;
  hazard_type: "slip_trip_fall" | "fire" | "electrical" | "chemical" | "structural" | "equipment" | "environmental" | "security" | "biological" | "ergonomic" | "other";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  immediate_action_taken: boolean;
  immediate_action_description: string | null;
  photograph_attached: boolean;
  risk_assessment_completed: boolean;
  risk_assessment_date: string | null;
  status: "open" | "in_progress" | "resolved" | "closed";
  resolved_date: string | null;
  resolution_description: string | null;
  resolution_verified: boolean;
  days_to_resolve: number | null;
  recurrence_flag: boolean;
  escalated_to_manager: boolean;
  created_at: string;
}

export interface NearMissRecordInput {
  id: string;
  reported_by: string;
  reporter_role: "staff" | "child" | "visitor" | "contractor" | "manager" | "other";
  date_reported: string;
  date_of_incident: string;
  location: string;
  near_miss_type: "slip_trip" | "falling_object" | "medication_error" | "unsecured_area" | "equipment_failure" | "supervision_gap" | "fire_risk" | "chemical_exposure" | "security_breach" | "other";
  potential_severity: "minor" | "moderate" | "serious" | "catastrophic";
  description: string;
  contributing_factors: string[];
  immediate_action_taken: boolean;
  reported_within_24h: boolean;
  investigated: boolean;
  investigation_date: string | null;
  investigation_findings: string | null;
  preventive_actions_identified: boolean;
  preventive_actions_completed: boolean;
  preventive_action_completion_date: string | null;
  shared_with_team: boolean;
  child_involved: boolean;
  child_id: string | null;
  status: "open" | "investigating" | "actions_pending" | "closed";
  created_at: string;
}

export interface CorrectiveActionRecordInput {
  id: string;
  source_type: "hazard_report" | "near_miss" | "safety_walk" | "incident" | "audit" | "inspection" | "complaint" | "other";
  source_id: string | null;
  action_description: string;
  assigned_to: string;
  assigned_date: string;
  due_date: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "pending" | "in_progress" | "completed" | "overdue" | "cancelled";
  completed_date: string | null;
  completed_on_time: boolean;
  effectiveness_verified: boolean;
  verification_date: string | null;
  verification_notes: string | null;
  follow_up_required: boolean;
  follow_up_completed: boolean;
  cost_incurred: boolean;
  recurrence_prevented: boolean;
  created_at: string;
}

export interface SafetyWalkRecordInput {
  id: string;
  conducted_by: string;
  conductor_role: "manager" | "senior_staff" | "health_safety_lead" | "external_auditor" | "other";
  date_conducted: string;
  areas_inspected: string[];
  total_areas_planned: number;
  total_areas_completed: number;
  hazards_identified: number;
  near_misses_identified: number;
  positive_observations: number;
  staff_engaged_during_walk: boolean;
  children_consulted: boolean;
  report_completed: boolean;
  report_shared_with_team: boolean;
  actions_raised: number;
  actions_completed: number;
  follow_up_walk_scheduled: boolean;
  follow_up_walk_date: string | null;
  overall_compliance_score: number; // 1-5
  notes: string | null;
  created_at: string;
}

export interface IncidentLearningRecordInput {
  id: string;
  incident_id: string | null;
  incident_type: "hazard" | "near_miss" | "accident" | "safeguarding" | "restraint" | "medication_error" | "fire" | "security_breach" | "other";
  incident_date: string;
  review_date: string;
  review_conducted_by: string;
  root_cause_identified: boolean;
  root_cause_description: string | null;
  lessons_identified: string[];
  lessons_shared_with_team: boolean;
  lessons_shared_date: string | null;
  lessons_shared_method: "team_meeting" | "email" | "notice_board" | "supervision" | "training" | "handover" | "other" | null;
  policy_update_required: boolean;
  policy_update_completed: boolean;
  training_need_identified: boolean;
  training_delivered: boolean;
  training_date: string | null;
  improvement_action_identified: boolean;
  improvement_action_completed: boolean;
  improvement_action_effective: boolean;
  child_debrief_completed: boolean;
  staff_debrief_completed: boolean;
  systemic_issue_identified: boolean;
  recurrence_check_date: string | null;
  recurrence_occurred: boolean;
  created_at: string;
}

export interface HazardNearMissInput {
  today: string;
  total_children: number;
  hazard_report_records: HazardReportRecordInput[];
  near_miss_records: NearMissRecordInput[];
  corrective_action_records: CorrectiveActionRecordInput[];
  safety_walk_records: SafetyWalkRecordInput[];
  incident_learning_records: IncidentLearningRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type HazardNearMissRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface HazardNearMissInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface HazardNearMissRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface HazardNearMissResult {
  hazard_rating: HazardNearMissRating;
  hazard_score: number;
  headline: string;
  total_hazard_reports: number;
  total_near_misses: number;
  total_corrective_actions: number;
  total_safety_walks: number;
  total_incident_learnings: number;
  hazard_reporting_rate: number;
  near_miss_tracking_rate: number;
  corrective_action_rate: number;
  safety_walk_rate: number;
  incident_learning_rate: number;
  staff_engagement_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: HazardNearMissRecommendation[];
  insights: HazardNearMissInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): HazardNearMissRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: HazardNearMissRating,
  score: number,
  headline: string,
): HazardNearMissResult {
  return {
    hazard_rating: rating,
    hazard_score: score,
    headline,
    total_hazard_reports: 0,
    total_near_misses: 0,
    total_corrective_actions: 0,
    total_safety_walks: 0,
    total_incident_learnings: 0,
    hazard_reporting_rate: 0,
    near_miss_tracking_rate: 0,
    corrective_action_rate: 0,
    safety_walk_rate: 0,
    incident_learning_rate: 0,
    staff_engagement_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeHazardNearMissReporting(
  input: HazardNearMissInput,
): HazardNearMissResult {
  const {
    total_children,
    hazard_report_records,
    near_miss_records,
    corrective_action_records,
    safety_walk_records,
    incident_learning_records,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    hazard_report_records.length === 0 &&
    near_miss_records.length === 0 &&
    corrective_action_records.length === 0 &&
    safety_walk_records.length === 0 &&
    incident_learning_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess hazard identification and near miss reporting.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No hazard identification or near miss reporting data recorded despite children on placement — safety reporting culture requires urgent attention.",
      ),
      concerns: [
        "No hazard reports, near miss records, corrective actions, safety walks, or incident learning records exist despite children being on placement — the home cannot evidence any proactive safety reporting culture or hazard management.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured hazard identification and near miss reporting systems immediately — all staff must be trained and empowered to identify and report hazards and near misses as they arise to protect children's safety.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 25 — Premises",
        },
        {
          rank: 2,
          recommendation:
            "Establish a regular safety walk programme conducted by management, with documented corrective actions and an incident learning process to build a proactive safety culture within the home.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 5 — Registered person",
        },
      ],
      insights: [
        {
          text: "The complete absence of hazard identification, near miss reporting, safety walks, corrective actions, and incident learning records means Ofsted cannot verify that the home operates a safety reporting culture. This represents a fundamental gap in Reg 25 (premises) and Reg 5 (management oversight) compliance.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- Hazard report metrics ---
  const totalHazardReports = hazard_report_records.length;

  const hazardsWithImmediateAction = hazard_report_records.filter(
    (h) => h.immediate_action_taken,
  ).length;
  const immediateActionRate = pct(hazardsWithImmediateAction, totalHazardReports);

  const hazardsResolved = hazard_report_records.filter(
    (h) => h.status === "resolved" || h.status === "closed",
  ).length;
  const hazardResolutionRate = pct(hazardsResolved, totalHazardReports);

  const hazardsWithRiskAssessment = hazard_report_records.filter(
    (h) => h.risk_assessment_completed,
  ).length;
  const riskAssessmentCompletionRate = pct(hazardsWithRiskAssessment, totalHazardReports);

  const hazardsVerified = hazard_report_records.filter(
    (h) => (h.status === "resolved" || h.status === "closed") && h.resolution_verified,
  ).length;
  const resolutionVerificationRate = pct(hazardsVerified, hazardsResolved);

  const hazardsEscalated = hazard_report_records.filter(
    (h) => h.escalated_to_manager,
  ).length;
  const escalationRate = pct(hazardsEscalated, totalHazardReports);

  const criticalHazards = hazard_report_records.filter(
    (h) => h.severity === "critical" || h.severity === "high",
  ).length;
  const criticalHazardRate = pct(criticalHazards, totalHazardReports);

  const hazardsWithPhoto = hazard_report_records.filter(
    (h) => h.photograph_attached,
  ).length;
  const photoEvidenceRate = pct(hazardsWithPhoto, totalHazardReports);

  const recurrentHazards = hazard_report_records.filter(
    (h) => h.recurrence_flag,
  ).length;
  const recurrenceRate = pct(recurrentHazards, totalHazardReports);

  // Composite hazard reporting rate: immediate action + resolved + risk assessment + verified
  const hazardReportingNumerator =
    hazardsWithImmediateAction + hazardsResolved + hazardsWithRiskAssessment + hazardsVerified;
  const hazardReportingDenominator = totalHazardReports * 4;
  const hazardReportingRate = pct(hazardReportingNumerator, hazardReportingDenominator);

  // Reporter role diversity — how many distinct roles are reporting
  const reporterRoles = new Set(hazard_report_records.map((h) => h.reporter_role));
  const reporterDiversity = reporterRoles.size;

  // Hazard type diversity — how many distinct hazard types logged
  const hazardTypes = new Set(hazard_report_records.map((h) => h.hazard_type));

  // Open / overdue hazards
  const openHazards = hazard_report_records.filter(
    (h) => h.status === "open" || h.status === "in_progress",
  ).length;
  const openHazardRate = pct(openHazards, totalHazardReports);

  // --- Near miss metrics ---
  const totalNearMisses = near_miss_records.length;

  const nearMissInvestigated = near_miss_records.filter(
    (n) => n.investigated,
  ).length;
  const nearMissInvestigationRate = pct(nearMissInvestigated, totalNearMisses);

  const nearMissReportedWithin24h = near_miss_records.filter(
    (n) => n.reported_within_24h,
  ).length;
  const timelyReportingRate = pct(nearMissReportedWithin24h, totalNearMisses);

  const nearMissPreventiveIdentified = near_miss_records.filter(
    (n) => n.preventive_actions_identified,
  ).length;
  const preventiveActionIdentifiedRate = pct(nearMissPreventiveIdentified, totalNearMisses);

  const nearMissPreventiveCompleted = near_miss_records.filter(
    (n) => n.preventive_actions_identified && n.preventive_actions_completed,
  ).length;
  const preventiveActionCompletedRate = pct(
    nearMissPreventiveCompleted,
    nearMissPreventiveIdentified,
  );

  const nearMissShared = near_miss_records.filter(
    (n) => n.shared_with_team,
  ).length;
  const nearMissSharingRate = pct(nearMissShared, totalNearMisses);

  const nearMissWithImmediateAction = near_miss_records.filter(
    (n) => n.immediate_action_taken,
  ).length;
  const nearMissImmediateActionRate = pct(nearMissWithImmediateAction, totalNearMisses);

  const nearMissClosed = near_miss_records.filter(
    (n) => n.status === "closed",
  ).length;
  const nearMissClosureRate = pct(nearMissClosed, totalNearMisses);

  const nearMissCatastrophic = near_miss_records.filter(
    (n) => n.potential_severity === "catastrophic" || n.potential_severity === "serious",
  ).length;
  const seriousNearMissRate = pct(nearMissCatastrophic, totalNearMisses);

  // Near miss child involvement
  const nearMissChildInvolved = near_miss_records.filter(
    (n) => n.child_involved,
  ).length;
  const childInvolvedNearMissRate = pct(nearMissChildInvolved, totalNearMisses);

  // Composite near miss tracking rate: investigated + timely + preventive completed + shared
  const nearMissTrackingNumerator =
    nearMissInvestigated + nearMissReportedWithin24h + nearMissPreventiveCompleted + nearMissShared;
  const nearMissTrackingDenominator = totalNearMisses * 4;
  const nearMissTrackingRate = pct(nearMissTrackingNumerator, nearMissTrackingDenominator);

  // Near miss type analysis
  const nearMissTypes: Record<string, number> = {};
  for (const n of near_miss_records) {
    nearMissTypes[n.near_miss_type] = (nearMissTypes[n.near_miss_type] ?? 0) + 1;
  }

  // --- Corrective action metrics ---
  const totalCorrectiveActions = corrective_action_records.length;

  const actionsCompleted = corrective_action_records.filter(
    (a) => a.status === "completed",
  ).length;
  const actionCompletionRate = pct(actionsCompleted, totalCorrectiveActions);

  const actionsCompletedOnTime = corrective_action_records.filter(
    (a) => a.status === "completed" && a.completed_on_time,
  ).length;
  const onTimeCompletionRate = pct(actionsCompletedOnTime, actionsCompleted);

  const actionsVerified = corrective_action_records.filter(
    (a) => a.effectiveness_verified,
  ).length;
  const effectivenessVerificationRate = pct(actionsVerified, totalCorrectiveActions);

  const actionsRecurrencePrevented = corrective_action_records.filter(
    (a) => a.status === "completed" && a.recurrence_prevented,
  ).length;
  const recurrencePreventionRate = pct(actionsRecurrencePrevented, actionsCompleted);

  const overdueActions = corrective_action_records.filter(
    (a) => a.status === "overdue",
  ).length;
  const overdueActionRate = pct(overdueActions, totalCorrectiveActions);

  const criticalActions = corrective_action_records.filter(
    (a) => a.priority === "critical" || a.priority === "high",
  ).length;
  const criticalActionRate = pct(criticalActions, totalCorrectiveActions);

  const criticalActionsCompleted = corrective_action_records.filter(
    (a) =>
      (a.priority === "critical" || a.priority === "high") &&
      a.status === "completed",
  ).length;
  const criticalActionCompletionRate = pct(criticalActionsCompleted, criticalActions);

  const followUpRequired = corrective_action_records.filter(
    (a) => a.follow_up_required,
  ).length;
  const followUpCompleted = corrective_action_records.filter(
    (a) => a.follow_up_required && a.follow_up_completed,
  ).length;
  const followUpCompletionRate = pct(followUpCompleted, followUpRequired);

  // Composite corrective action rate: completed + on time + verified + recurrence prevented
  const correctiveActionNumerator =
    actionsCompleted + actionsCompletedOnTime + actionsVerified + actionsRecurrencePrevented;
  const correctiveActionDenominator = totalCorrectiveActions * 4;
  const correctiveActionRate = pct(correctiveActionNumerator, correctiveActionDenominator);

  // --- Safety walk metrics ---
  const totalSafetyWalks = safety_walk_records.length;

  const walksWithReports = safety_walk_records.filter(
    (w) => w.report_completed,
  ).length;
  const walkReportCompletionRate = pct(walksWithReports, totalSafetyWalks);

  const walksShared = safety_walk_records.filter(
    (w) => w.report_shared_with_team,
  ).length;
  const walkSharingRate = pct(walksShared, totalSafetyWalks);

  const walksWithStaffEngagement = safety_walk_records.filter(
    (w) => w.staff_engaged_during_walk,
  ).length;
  const walkStaffEngagementRate = pct(walksWithStaffEngagement, totalSafetyWalks);

  const walksWithChildConsultation = safety_walk_records.filter(
    (w) => w.children_consulted,
  ).length;
  const walkChildConsultationRate = pct(walksWithChildConsultation, totalSafetyWalks);

  const walksWithFollowUp = safety_walk_records.filter(
    (w) => w.follow_up_walk_scheduled,
  ).length;
  const followUpWalkRate = pct(walksWithFollowUp, totalSafetyWalks);

  // Walk area coverage
  const totalAreasPlanned = safety_walk_records.reduce(
    (sum, w) => sum + w.total_areas_planned,
    0,
  );
  const totalAreasCompleted = safety_walk_records.reduce(
    (sum, w) => sum + w.total_areas_completed,
    0,
  );
  const areaCoverageRate = pct(totalAreasCompleted, totalAreasPlanned);

  // Walk actions completion
  const totalWalkActionsRaised = safety_walk_records.reduce(
    (sum, w) => sum + w.actions_raised,
    0,
  );
  const totalWalkActionsCompleted = safety_walk_records.reduce(
    (sum, w) => sum + w.actions_completed,
    0,
  );
  const walkActionCompletionRate = pct(totalWalkActionsCompleted, totalWalkActionsRaised);

  // Walk compliance score average
  const walkComplianceSum = safety_walk_records.reduce(
    (sum, w) => sum + w.overall_compliance_score,
    0,
  );
  const avgWalkComplianceScore =
    totalSafetyWalks > 0
      ? Math.round((walkComplianceSum / totalSafetyWalks) * 100) / 100
      : 0;

  // Total hazards found on walks
  const totalWalkHazards = safety_walk_records.reduce(
    (sum, w) => sum + w.hazards_identified,
    0,
  );
  const totalWalkPositives = safety_walk_records.reduce(
    (sum, w) => sum + w.positive_observations,
    0,
  );

  // Composite safety walk rate: report + shared + area coverage + action completion
  const safetyWalkNumerator =
    walksWithReports + walksShared + totalAreasCompleted + totalWalkActionsCompleted;
  const safetyWalkDenominator =
    totalSafetyWalks + totalSafetyWalks + totalAreasPlanned + totalWalkActionsRaised;
  const safetyWalkRate = pct(safetyWalkNumerator, safetyWalkDenominator);

  // --- Incident learning metrics ---
  const totalIncidentLearnings = incident_learning_records.length;

  const rootCauseIdentified = incident_learning_records.filter(
    (l) => l.root_cause_identified,
  ).length;
  const rootCauseRate = pct(rootCauseIdentified, totalIncidentLearnings);

  const lessonsShared = incident_learning_records.filter(
    (l) => l.lessons_shared_with_team,
  ).length;
  const lessonSharingRate = pct(lessonsShared, totalIncidentLearnings);

  const policyUpdateRequired = incident_learning_records.filter(
    (l) => l.policy_update_required,
  ).length;
  const policyUpdateCompleted = incident_learning_records.filter(
    (l) => l.policy_update_required && l.policy_update_completed,
  ).length;
  const policyUpdateCompletionRate = pct(policyUpdateCompleted, policyUpdateRequired);

  const trainingNeedIdentified = incident_learning_records.filter(
    (l) => l.training_need_identified,
  ).length;
  const trainingDelivered = incident_learning_records.filter(
    (l) => l.training_need_identified && l.training_delivered,
  ).length;
  const trainingDeliveryRate = pct(trainingDelivered, trainingNeedIdentified);

  const improvementActionIdentified = incident_learning_records.filter(
    (l) => l.improvement_action_identified,
  ).length;
  const improvementActionCompleted = incident_learning_records.filter(
    (l) => l.improvement_action_identified && l.improvement_action_completed,
  ).length;
  const improvementActionCompletionRate = pct(
    improvementActionCompleted,
    improvementActionIdentified,
  );

  const improvementActionEffective = incident_learning_records.filter(
    (l) =>
      l.improvement_action_identified &&
      l.improvement_action_completed &&
      l.improvement_action_effective,
  ).length;
  const improvementEffectivenessRate = pct(
    improvementActionEffective,
    improvementActionCompleted,
  );

  const childDebriefCompleted = incident_learning_records.filter(
    (l) => l.child_debrief_completed,
  ).length;
  const childDebriefRate = pct(childDebriefCompleted, totalIncidentLearnings);

  const staffDebriefCompleted = incident_learning_records.filter(
    (l) => l.staff_debrief_completed,
  ).length;
  const staffDebriefRate = pct(staffDebriefCompleted, totalIncidentLearnings);

  const systemicIssues = incident_learning_records.filter(
    (l) => l.systemic_issue_identified,
  ).length;
  const systemicIssueRate = pct(systemicIssues, totalIncidentLearnings);

  const recurrenceChecked = incident_learning_records.filter(
    (l) => l.recurrence_check_date !== null,
  ).length;
  const recurrenceCheckRate = pct(recurrenceChecked, totalIncidentLearnings);

  const recurrenceOccurred = incident_learning_records.filter(
    (l) => l.recurrence_occurred,
  ).length;
  const actualRecurrenceRate = pct(recurrenceOccurred, totalIncidentLearnings);

  // Composite incident learning rate: root cause + lessons shared + improvement completed + child debrief
  const incidentLearningNumerator =
    rootCauseIdentified + lessonsShared + improvementActionCompleted + childDebriefCompleted;
  const incidentLearningDenominator = totalIncidentLearnings * 4;
  const incidentLearningRate = pct(incidentLearningNumerator, incidentLearningDenominator);

  // --- Staff engagement rate (cross-cutting) ---
  // Composite: walk staff engagement + near miss sharing + hazard escalation + lessons shared
  const staffEngagementNumerator =
    walksWithStaffEngagement + nearMissShared + hazardsEscalated + lessonsShared;
  const staffEngagementDenominator =
    totalSafetyWalks + totalNearMisses + totalHazardReports + totalIncidentLearnings;
  const staffEngagementRate = pct(staffEngagementNumerator, staffEngagementDenominator);

  // ── Scoring: base 52 ─────────────────────────────────────────────────

  let score = 52;

  // --- Bonus 1: hazardReportingRate (>=85: +4, >=65: +2) ---
  if (hazardReportingRate >= 85) score += 4;
  else if (hazardReportingRate >= 65) score += 2;

  // --- Bonus 2: nearMissTrackingRate (>=85: +4, >=65: +2) ---
  if (nearMissTrackingRate >= 85) score += 4;
  else if (nearMissTrackingRate >= 65) score += 2;

  // --- Bonus 3: correctiveActionRate (>=85: +4, >=65: +2) ---
  if (correctiveActionRate >= 85) score += 4;
  else if (correctiveActionRate >= 65) score += 2;

  // --- Bonus 4: safetyWalkRate (>=85: +3, >=65: +1) ---
  if (safetyWalkRate >= 85) score += 3;
  else if (safetyWalkRate >= 65) score += 1;

  // --- Bonus 5: incidentLearningRate (>=85: +4, >=65: +2) ---
  if (incidentLearningRate >= 85) score += 4;
  else if (incidentLearningRate >= 65) score += 2;

  // --- Bonus 6: staffEngagementRate (>=85: +3, >=65: +1) ---
  if (staffEngagementRate >= 85) score += 3;
  else if (staffEngagementRate >= 65) score += 1;

  // --- Bonus 7: timelyReportingRate (>=90: +3, >=70: +1) ---
  if (timelyReportingRate >= 90) score += 3;
  else if (timelyReportingRate >= 70) score += 1;

  // --- Bonus 8: rootCauseRate (>=90: +3, >=70: +1) ---
  if (rootCauseRate >= 90) score += 3;
  else if (rootCauseRate >= 70) score += 1;

  // Max bonuses: 4+4+4+3+4+3+3+3 = 28

  // ── Penalties ─────────────────────────────────────────────────────────

  // hazardResolutionRate < 50 → -5
  if (hazardResolutionRate < 50 && hazard_report_records.length > 0) score -= 5;

  // nearMissInvestigationRate < 50 → -5
  if (nearMissInvestigationRate < 50 && near_miss_records.length > 0) score -= 5;

  // overdueActionRate > 40 → -5
  if (overdueActionRate > 40 && corrective_action_records.length > 0) score -= 5;

  // actualRecurrenceRate > 30 → -3
  if (actualRecurrenceRate > 30 && incident_learning_records.length > 0) score -= 3;

  score = clamp(score, 0, 100);

  const hazard_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (hazardReportingRate >= 85 && totalHazardReports > 0) {
    strengths.push(
      `${hazardReportingRate}% hazard reporting quality — hazards are identified with immediate action, risk assessments are completed, resolutions are verified, and the home demonstrates a proactive approach to hazard management.`,
    );
  } else if (hazardReportingRate >= 65 && totalHazardReports > 0) {
    strengths.push(
      `${hazardReportingRate}% hazard reporting quality — the home generally manages identified hazards with appropriate risk assessments and follow-through.`,
    );
  }

  if (nearMissTrackingRate >= 85 && totalNearMisses > 0) {
    strengths.push(
      `${nearMissTrackingRate}% near miss tracking quality — near misses are investigated promptly, reported within 24 hours, preventive actions completed, and learnings shared with the team.`,
    );
  } else if (nearMissTrackingRate >= 65 && totalNearMisses > 0) {
    strengths.push(
      `${nearMissTrackingRate}% near miss tracking quality — near misses are generally investigated and acted upon with appropriate team communication.`,
    );
  }

  if (correctiveActionRate >= 85 && totalCorrectiveActions > 0) {
    strengths.push(
      `${correctiveActionRate}% corrective action effectiveness — actions are completed on time, effectiveness is verified, and recurrence is prevented, demonstrating a robust corrective action process.`,
    );
  } else if (correctiveActionRate >= 65 && totalCorrectiveActions > 0) {
    strengths.push(
      `${correctiveActionRate}% corrective action effectiveness — the home generally follows through on corrective actions with reasonable verification and prevention of recurrence.`,
    );
  }

  if (safetyWalkRate >= 85 && totalSafetyWalks > 0) {
    strengths.push(
      `${safetyWalkRate}% safety walk compliance — walks cover planned areas, reports are completed and shared, and identified actions are followed through, showing strong management oversight of premises safety.`,
    );
  } else if (safetyWalkRate >= 65 && totalSafetyWalks > 0) {
    strengths.push(
      `${safetyWalkRate}% safety walk compliance — the home conducts regular safety walks with generally adequate reporting and action follow-through.`,
    );
  }

  if (incidentLearningRate >= 85 && totalIncidentLearnings > 0) {
    strengths.push(
      `${incidentLearningRate}% incident learning quality — root causes are identified, lessons are shared with the team, improvement actions are completed, and children are debriefed, evidencing a genuine learning culture.`,
    );
  } else if (incidentLearningRate >= 65 && totalIncidentLearnings > 0) {
    strengths.push(
      `${incidentLearningRate}% incident learning quality — the home generally learns from incidents with root cause analysis and team sharing.`,
    );
  }

  if (staffEngagementRate >= 85) {
    strengths.push(
      `${staffEngagementRate}% staff engagement in safety reporting — staff actively participate in safety walks, share near miss learnings, escalate hazards to management, and engage with incident review, demonstrating a strong safety culture.`,
    );
  } else if (staffEngagementRate >= 65) {
    strengths.push(
      `${staffEngagementRate}% staff engagement in safety reporting — staff generally participate in safety reporting activities and team learning.`,
    );
  }

  if (timelyReportingRate >= 90 && totalNearMisses > 0) {
    strengths.push(
      `${timelyReportingRate}% of near misses reported within 24 hours — the home demonstrates a culture of timely reporting where staff understand the importance of prompt near miss disclosure.`,
    );
  } else if (timelyReportingRate >= 70 && totalNearMisses > 0) {
    strengths.push(
      `${timelyReportingRate}% of near misses reported within 24 hours — most near misses are reported promptly, supporting effective investigation and action.`,
    );
  }

  if (rootCauseRate >= 90 && totalIncidentLearnings > 0) {
    strengths.push(
      `${rootCauseRate}% root cause identification — the home consistently identifies underlying causes of incidents, enabling targeted interventions that address systemic issues rather than symptoms.`,
    );
  } else if (rootCauseRate >= 70 && totalIncidentLearnings > 0) {
    strengths.push(
      `${rootCauseRate}% root cause identification — the home generally identifies root causes of incidents to guide corrective actions.`,
    );
  }

  if (immediateActionRate >= 90 && totalHazardReports > 0) {
    strengths.push(
      `${immediateActionRate}% immediate action taken on reported hazards — staff respond promptly to identified risks, minimising the window of exposure for children and others.`,
    );
  } else if (immediateActionRate >= 70 && totalHazardReports > 0) {
    strengths.push(
      `${immediateActionRate}% immediate action on hazards — the majority of identified hazards receive prompt initial response.`,
    );
  }

  if (walkChildConsultationRate >= 80 && totalSafetyWalks > 0) {
    strengths.push(
      `${walkChildConsultationRate}% of safety walks include child consultation — children's perspectives on their safety and environment are actively sought during safety walks, supporting the voice of the child.`,
    );
  } else if (walkChildConsultationRate >= 60 && totalSafetyWalks > 0) {
    strengths.push(
      `${walkChildConsultationRate}% of safety walks include child consultation — children are consulted during the majority of safety walks about their environment.`,
    );
  }

  if (lessonSharingRate >= 90 && totalIncidentLearnings > 0) {
    strengths.push(
      `${lessonSharingRate}% lesson sharing rate — learnings from incidents are consistently disseminated across the team, building collective understanding and preventing recurrence.`,
    );
  } else if (lessonSharingRate >= 70 && totalIncidentLearnings > 0) {
    strengths.push(
      `${lessonSharingRate}% lesson sharing rate — the majority of incident learnings are shared with the wider team.`,
    );
  }

  if (preventiveActionCompletedRate >= 90 && nearMissPreventiveIdentified > 0) {
    strengths.push(
      `${preventiveActionCompletedRate}% of identified preventive actions completed following near misses — the home consistently converts near miss investigations into tangible safety improvements.`,
    );
  } else if (preventiveActionCompletedRate >= 70 && nearMissPreventiveIdentified > 0) {
    strengths.push(
      `${preventiveActionCompletedRate}% of preventive actions completed — the majority of near miss investigations lead to completed preventive measures.`,
    );
  }

  if (onTimeCompletionRate >= 90 && actionsCompleted > 0) {
    strengths.push(
      `${onTimeCompletionRate}% of corrective actions completed on time — the home demonstrates disciplined follow-through on safety-related actions within agreed timescales.`,
    );
  } else if (onTimeCompletionRate >= 70 && actionsCompleted > 0) {
    strengths.push(
      `${onTimeCompletionRate}% of corrective actions completed on time — most corrective actions are delivered within the agreed timescales.`,
    );
  }

  if (recurrencePreventionRate >= 90 && actionsCompleted > 0) {
    strengths.push(
      `${recurrencePreventionRate}% recurrence prevention rate — completed corrective actions are effective in preventing the same hazards or incidents from recurring, indicating well-targeted interventions.`,
    );
  } else if (recurrencePreventionRate >= 70 && actionsCompleted > 0) {
    strengths.push(
      `${recurrencePreventionRate}% recurrence prevention rate — the majority of completed corrective actions successfully prevent recurrence of the original issue.`,
    );
  }

  if (reporterDiversity >= 3 && totalHazardReports > 0) {
    strengths.push(
      `Hazard reports received from ${reporterDiversity} different role types — a diverse range of people are contributing to hazard identification, indicating an open and inclusive safety reporting culture.`,
    );
  }

  if (childDebriefRate >= 80 && totalIncidentLearnings > 0) {
    strengths.push(
      `${childDebriefRate}% child debrief completion rate — children are consistently debriefed following incidents, ensuring their voice is heard and their experience is understood.`,
    );
  }

  if (staffDebriefRate >= 80 && totalIncidentLearnings > 0) {
    strengths.push(
      `${staffDebriefRate}% staff debrief completion rate — staff are consistently debriefed following incidents, supporting their wellbeing and enabling reflective practice.`,
    );
  }

  if (avgWalkComplianceScore >= 4.0 && totalSafetyWalks > 0) {
    strengths.push(
      `Average safety walk compliance score of ${avgWalkComplianceScore}/5 — premises consistently meet high safety standards during formal inspections.`,
    );
  } else if (avgWalkComplianceScore >= 3.5 && totalSafetyWalks > 0) {
    strengths.push(
      `Average safety walk compliance score of ${avgWalkComplianceScore}/5 — premises generally meet acceptable safety standards during inspections.`,
    );
  }

  if (trainingDeliveryRate >= 90 && trainingNeedIdentified > 0) {
    strengths.push(
      `${trainingDeliveryRate}% training delivery rate following incident learning — identified training needs are consistently delivered, ensuring staff develop the competencies required to prevent recurrence.`,
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (hazardResolutionRate < 50 && totalHazardReports > 0) {
    concerns.push(
      `Only ${hazardResolutionRate}% of reported hazards resolved — the majority of identified hazards remain open, leaving children and staff exposed to known risks. This fundamentally undermines the home's duty to maintain safe premises.`,
    );
  } else if (hazardResolutionRate < 70 && hazardResolutionRate >= 50 && totalHazardReports > 0) {
    concerns.push(
      `Hazard resolution rate at ${hazardResolutionRate}% — a significant proportion of identified hazards have not been resolved, creating ongoing risk exposure.`,
    );
  }

  if (nearMissInvestigationRate < 50 && totalNearMisses > 0) {
    concerns.push(
      `Only ${nearMissInvestigationRate}% of near misses investigated — the majority of near misses are not being investigated, meaning the home is missing critical opportunities to prevent actual incidents. This represents a significant gap in proactive safety management.`,
    );
  } else if (nearMissInvestigationRate < 70 && nearMissInvestigationRate >= 50 && totalNearMisses > 0) {
    concerns.push(
      `Near miss investigation rate at ${nearMissInvestigationRate}% — a significant proportion of near misses are not being investigated, limiting the home's ability to learn and prevent incidents.`,
    );
  }

  if (overdueActionRate > 40 && totalCorrectiveActions > 0) {
    concerns.push(
      `${overdueActionRate}% of corrective actions are overdue — a critical proportion of safety actions have not been completed within agreed timescales, indicating failure in the home's action tracking and accountability systems.`,
    );
  } else if (overdueActionRate > 20 && overdueActionRate <= 40 && totalCorrectiveActions > 0) {
    concerns.push(
      `${overdueActionRate}% of corrective actions are overdue — some safety actions are not being completed within agreed timescales, requiring management attention.`,
    );
  }

  if (actualRecurrenceRate > 30 && totalIncidentLearnings > 0) {
    concerns.push(
      `${actualRecurrenceRate}% incident recurrence rate — a significant proportion of incidents are recurring despite learning reviews, indicating that corrective actions are not effectively preventing the same issues from happening again.`,
    );
  } else if (actualRecurrenceRate > 15 && actualRecurrenceRate <= 30 && totalIncidentLearnings > 0) {
    concerns.push(
      `${actualRecurrenceRate}% incident recurrence rate — some incidents continue to recur despite learning reviews, suggesting corrective actions need strengthening.`,
    );
  }

  if (immediateActionRate < 50 && totalHazardReports > 0) {
    concerns.push(
      `Only ${immediateActionRate}% immediate action taken on hazards — the majority of identified hazards do not receive prompt initial action, increasing the duration of risk exposure for children.`,
    );
  } else if (immediateActionRate < 70 && immediateActionRate >= 50 && totalHazardReports > 0) {
    concerns.push(
      `Immediate action rate at ${immediateActionRate}% — some identified hazards are not receiving prompt initial response, delaying risk mitigation.`,
    );
  }

  if (timelyReportingRate < 50 && totalNearMisses > 0) {
    concerns.push(
      `Only ${timelyReportingRate}% of near misses reported within 24 hours — delayed reporting undermines the home's ability to investigate effectively and implement timely preventive actions.`,
    );
  } else if (timelyReportingRate < 70 && timelyReportingRate >= 50 && totalNearMisses > 0) {
    concerns.push(
      `Timely reporting rate at ${timelyReportingRate}% — a significant proportion of near misses are not reported within 24 hours, delaying investigation and action.`,
    );
  }

  if (rootCauseRate < 50 && totalIncidentLearnings > 0) {
    concerns.push(
      `Only ${rootCauseRate}% root cause identification — the majority of incident reviews fail to identify underlying causes, meaning the home is treating symptoms rather than addressing systemic issues.`,
    );
  } else if (rootCauseRate < 70 && rootCauseRate >= 50 && totalIncidentLearnings > 0) {
    concerns.push(
      `Root cause identification rate at ${rootCauseRate}% — a significant proportion of incident reviews are not identifying underlying causes.`,
    );
  }

  if (lessonSharingRate < 50 && totalIncidentLearnings > 0) {
    concerns.push(
      `Only ${lessonSharingRate}% of incident learnings shared with the team — the majority of lessons are not being communicated, preventing the development of a shared learning culture.`,
    );
  } else if (lessonSharingRate < 70 && lessonSharingRate >= 50 && totalIncidentLearnings > 0) {
    concerns.push(
      `Lesson sharing rate at ${lessonSharingRate}% — not all incident learnings are being shared with the wider team, limiting organisational learning.`,
    );
  }

  if (riskAssessmentCompletionRate < 50 && totalHazardReports > 0) {
    concerns.push(
      `Only ${riskAssessmentCompletionRate}% of hazards have completed risk assessments — without risk assessments, the home cannot evidence that identified hazards are being evaluated systematically.`,
    );
  } else if (riskAssessmentCompletionRate < 70 && riskAssessmentCompletionRate >= 50 && totalHazardReports > 0) {
    concerns.push(
      `Risk assessment completion rate at ${riskAssessmentCompletionRate}% — not all identified hazards have undergone formal risk assessment.`,
    );
  }

  if (walkActionCompletionRate < 50 && totalWalkActionsRaised > 0) {
    concerns.push(
      `Only ${walkActionCompletionRate}% of safety walk actions completed — the majority of issues identified during safety walks are not being resolved, undermining the value of the safety walk programme.`,
    );
  } else if (walkActionCompletionRate < 70 && walkActionCompletionRate >= 50 && totalWalkActionsRaised > 0) {
    concerns.push(
      `Safety walk action completion at ${walkActionCompletionRate}% — some issues identified during safety walks are not being followed through.`,
    );
  }

  if (childDebriefRate < 50 && totalIncidentLearnings > 0) {
    concerns.push(
      `Only ${childDebriefRate}% child debrief completion — children are not being debriefed after the majority of incidents, which means their experience and perspective are not being captured or addressed.`,
    );
  } else if (childDebriefRate < 70 && childDebriefRate >= 50 && totalIncidentLearnings > 0) {
    concerns.push(
      `Child debrief completion at ${childDebriefRate}% — not all children are being debriefed following incidents.`,
    );
  }

  if (effectivenessVerificationRate < 50 && totalCorrectiveActions > 0) {
    concerns.push(
      `Only ${effectivenessVerificationRate}% of corrective actions have verified effectiveness — the home cannot evidence that completed actions have actually achieved their intended safety improvement.`,
    );
  } else if (effectivenessVerificationRate < 70 && effectivenessVerificationRate >= 50 && totalCorrectiveActions > 0) {
    concerns.push(
      `Effectiveness verification at ${effectivenessVerificationRate}% — not all corrective actions are being verified for effectiveness after completion.`,
    );
  }

  if (totalHazardReports === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No hazard reports exist despite children being on placement — the absence of any hazard reporting suggests either a lack of reporting culture or failure to identify hazards in the premises.",
    );
  }

  if (totalNearMisses === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No near miss records exist despite children being on placement — the absence of near miss reporting means the home is not capturing critical early warning signals that could prevent actual incidents.",
    );
  }

  if (totalSafetyWalks === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No safety walks recorded despite children being on placement — the home cannot evidence management oversight of premises safety through formal inspection walks.",
    );
  }

  if (totalIncidentLearnings === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No incident learning records exist despite children being on placement — the home cannot evidence that it learns from safety events to prevent recurrence and improve practice.",
    );
  }

  if (recurrenceRate > 30 && totalHazardReports > 0) {
    concerns.push(
      `${recurrenceRate}% hazard recurrence rate — a significant proportion of hazards are recurring, suggesting that initial resolutions are not adequately addressing root causes or maintaining fixes.`,
    );
  }

  if (seriousNearMissRate > 40 && totalNearMisses > 0) {
    concerns.push(
      `${seriousNearMissRate}% of near misses have serious or catastrophic potential severity — the home is experiencing a high proportion of near misses that could have resulted in major harm if circumstances had been slightly different.`,
    );
  }

  if (preventiveActionCompletedRate < 50 && nearMissPreventiveIdentified > 0) {
    concerns.push(
      `Only ${preventiveActionCompletedRate}% of identified preventive actions completed — near miss investigations are identifying actions but these are not being followed through, negating the value of the investigation.`,
    );
  }

  if (staffEngagementRate < 50) {
    concerns.push(
      `Staff engagement in safety reporting at only ${staffEngagementRate}% — staff are not actively participating in safety walks, hazard escalation, near miss sharing, or incident learning, indicating a weak safety culture.`,
    );
  } else if (staffEngagementRate < 65 && staffEngagementRate >= 50) {
    concerns.push(
      `Staff engagement in safety reporting at ${staffEngagementRate}% — staff participation in safety reporting activities is below expected levels.`,
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: HazardNearMissRecommendation[] = [];
  let rank = 0;

  if (hazardResolutionRate < 50 && totalHazardReports > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review and resolve all outstanding hazard reports — every unresolved hazard represents ongoing risk to children. Establish a hazard resolution escalation process with clear timescales for each severity level and management accountability for closure.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (nearMissInvestigationRate < 50 && totalNearMisses > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a structured near miss investigation process — every near miss must be investigated within 48 hours to identify contributing factors and preventive actions. Near misses are the leading indicators that prevent serious incidents; failing to investigate them leaves children at risk.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Registered person",
    });
  }

  if (overdueActionRate > 40 && totalCorrectiveActions > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently address all overdue corrective actions — management must review every overdue action, reallocate responsibility where necessary, and establish weekly monitoring to prevent future slippage. Overdue safety actions represent uncontrolled risk.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (actualRecurrenceRate > 30 && totalIncidentLearnings > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Conduct a thorough review of recurring incidents — where the same types of incidents keep happening despite learning reviews, the corrective actions are failing. Consider whether root cause analysis is reaching deep enough and whether systemic factors are being addressed.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Registered person",
    });
  }

  if (immediateActionRate < 50 && totalHazardReports > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Train all staff on immediate hazard response — when a hazard is identified, immediate temporary measures must be taken to mitigate risk before formal assessment and resolution. Every minute of delay increases exposure.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (totalHazardReports === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a hazard reporting system immediately — provide hazard reporting forms accessible to all staff, train the team on what constitutes a hazard, and create a culture where reporting is valued and acted upon.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (totalNearMisses === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish a near miss reporting system — near misses are critical early warning signals. Train all staff to recognise and report near misses, and create a no-blame reporting culture that encourages disclosure.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Registered person",
    });
  }

  if (totalSafetyWalks === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Commence regular management safety walks — schedule at least monthly formal safety inspections of the premises covering all areas, with documented findings, actions, and follow-up. Safety walks are a key management oversight tool.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (totalIncidentLearnings === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement an incident learning review process — every significant safety event must be reviewed to identify root causes, lessons, and improvement actions. Share learnings with the whole team to build a learning culture.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Registered person",
    });
  }

  if (rootCauseRate < 50 && totalIncidentLearnings > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Provide training on root cause analysis techniques — staff conducting incident reviews need structured methods (e.g., 5 Whys, fishbone diagrams) to move beyond surface-level findings and identify the underlying systemic causes of incidents.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Registered person",
    });
  }

  if (timelyReportingRate < 50 && totalNearMisses > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Address barriers to timely near miss reporting — review why staff are not reporting within 24 hours. Consider simplifying the reporting form, providing mobile-accessible reporting, and reinforcing that timely reporting enables effective investigation.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Registered person",
    });
  }

  if (lessonSharingRate < 50 && totalIncidentLearnings > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish a systematic approach to sharing incident learnings — use team meetings, supervision, handovers, and notice boards to ensure all staff are aware of lessons learned. Consider a monthly safety learning bulletin.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Registered person",
    });
  }

  if (childDebriefRate < 50 && totalIncidentLearnings > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure children are debriefed following every significant incident — age-appropriate debrief conversations help children process events, feel heard, and understand what is being done to keep them safe.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (riskAssessmentCompletionRate < 50 && totalHazardReports > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Complete risk assessments for all reported hazards — every identified hazard must be formally risk assessed to determine severity, likelihood, and appropriate control measures. This is fundamental to demonstrating Reg 25 compliance.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (
    hazardResolutionRate >= 50 &&
    hazardResolutionRate < 70 &&
    totalHazardReports > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve hazard resolution rate to above 70% — review the backlog of unresolved hazards, prioritise by severity, and assign clear ownership and timescales for each outstanding item.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (
    nearMissInvestigationRate >= 50 &&
    nearMissInvestigationRate < 70 &&
    totalNearMisses > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve near miss investigation rate above 70% — ensure every near miss receives at least a brief investigation within 48 hours, with contributing factors identified and preventive actions considered.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Registered person",
    });
  }

  if (
    walkActionCompletionRate >= 50 &&
    walkActionCompletionRate < 70 &&
    totalWalkActionsRaised > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve follow-through on safety walk actions — track all identified actions to completion and verify effectiveness. Uncompleted walk actions undermine the credibility of the safety walk programme.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (walkActionCompletionRate < 50 && totalWalkActionsRaised > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently address outstanding safety walk actions — the majority of issues found during safety walks are not being resolved. Establish an action tracker reviewed weekly by management.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (
    staffEngagementRate >= 50 &&
    staffEngagementRate < 65
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Enhance staff engagement in safety reporting — consider safety champions, incentivised reporting, regular safety briefings, and visible management commitment to safety to improve participation rates.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Registered person",
    });
  }

  if (staffEngagementRate < 50) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Build a safety reporting culture from the ground up — low staff engagement indicates a fundamental cultural problem. Management must visibly champion safety, celebrate reporting, respond promptly to reports, and demonstrate that reporting leads to positive change.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Registered person",
    });
  }

  if (
    effectivenessVerificationRate >= 50 &&
    effectivenessVerificationRate < 70 &&
    totalCorrectiveActions > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve verification of corrective action effectiveness — completing an action is not sufficient; the home must verify that the action actually achieved its intended safety improvement. Build verification steps into the action closure process.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (effectivenessVerificationRate < 50 && totalCorrectiveActions > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a corrective action verification process — without checking that actions work, the home is closing actions administratively without knowing whether safety has actually improved.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (walkChildConsultationRate < 50 && totalSafetyWalks > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Include children's perspectives in safety walks — ask children about their safety concerns, areas that feel unsafe, and changes they would like to see. This enriches the safety assessment and amplifies children's voices.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (
    preventiveActionCompletedRate >= 50 &&
    preventiveActionCompletedRate < 70 &&
    nearMissPreventiveIdentified > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve completion of near miss preventive actions to above 70% — identified preventive measures must be followed through to convert near miss learnings into tangible safety improvements.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Registered person",
    });
  }

  if (
    recurrenceRate > 15 &&
    recurrenceRate <= 30 &&
    totalHazardReports > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Investigate patterns in recurring hazards — identify common themes, locations, or contributing factors in hazards that keep reappearing and implement targeted, sustainable solutions.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (
    trainingDeliveryRate < 70 &&
    trainingNeedIdentified > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure identified training needs from incident learning are delivered promptly — training gaps identified through incident reviews represent known vulnerabilities that must be closed to prevent recurrence.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Registered person",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: HazardNearMissInsight[] = [];

  // -- Critical insights --

  if (hazardResolutionRate < 50 && totalHazardReports > 0) {
    insights.push({
      text: `Only ${hazardResolutionRate}% of hazards resolved. Ofsted expects children's homes to maintain safe premises under Reg 25. When the majority of identified hazards remain unresolved, the home cannot demonstrate that it is managing risk to children's safety, and Ofsted will question whether the registered person is discharging their duty under Reg 5.`,
      severity: "critical",
    });
  }

  if (nearMissInvestigationRate < 50 && totalNearMisses > 0) {
    insights.push({
      text: `Only ${nearMissInvestigationRate}% of near misses investigated. Near misses are the most valuable source of proactive safety intelligence — they reveal latent hazards before they cause harm. Failing to investigate them means the home is ignoring its best early warning system for preventing serious incidents.`,
      severity: "critical",
    });
  }

  if (overdueActionRate > 40 && totalCorrectiveActions > 0) {
    insights.push({
      text: `${overdueActionRate}% of corrective actions are overdue. When safety actions are not completed on time, identified risks persist and the action tracking system loses credibility. Staff may stop reporting hazards if they see that identified actions are not followed through. This represents a systemic management failure.`,
      severity: "critical",
    });
  }

  if (actualRecurrenceRate > 30 && totalIncidentLearnings > 0) {
    insights.push({
      text: `${actualRecurrenceRate}% incident recurrence. When incidents keep happening despite review and action, it indicates that root cause analysis is not reaching deep enough, corrective actions are too superficial, or systemic factors are being overlooked. Ofsted will view repeated incidents as evidence of inadequate learning.`,
      severity: "critical",
    });
  }

  if (immediateActionRate < 50 && totalHazardReports > 0) {
    insights.push({
      text: `Only ${immediateActionRate}% of hazards receive immediate action. Every moment a hazard is left unmitigated after identification represents ongoing risk to children. The gap between identification and initial response is a critical vulnerability in the home's safety system.`,
      severity: "critical",
    });
  }

  if (totalHazardReports === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No hazard reports recorded despite children being on placement. It is statistically impossible for a residential home to be entirely hazard-free. The absence of hazard reports indicates either a failure to identify hazards or a culture where reporting is not encouraged or valued. Ofsted will view this as a significant gap in Reg 25 compliance.",
      severity: "critical",
    });
  }

  if (totalNearMisses === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No near miss reports recorded. In a functioning safety culture, near misses should significantly outnumber actual incidents. Their absence suggests staff are not recognising or reporting near misses, which means the home has no early warning system for preventing harm.",
      severity: "critical",
    });
  }

  if (totalSafetyWalks === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No safety walks recorded. Regular management safety walks are a fundamental premises safety oversight tool. Without them, the home cannot demonstrate proactive management scrutiny of children's living environment as required by Reg 25 and Reg 5.",
      severity: "critical",
    });
  }

  if (rootCauseRate < 50 && totalIncidentLearnings > 0) {
    insights.push({
      text: `Only ${rootCauseRate}% root cause identification. Without identifying why incidents happen, the home can only address surface-level symptoms. This creates a cycle where the same underlying issues repeatedly generate new incidents. Ofsted expects evidence that the home understands the causes of safety events.`,
      severity: "critical",
    });
  }

  if (staffEngagementRate < 50) {
    insights.push({
      text: `Staff engagement in safety reporting at only ${staffEngagementRate}%. A strong safety culture depends on active staff participation — when staff do not engage with safety walks, do not share near miss learnings, and do not escalate hazards, the entire safety reporting system becomes hollow. This requires fundamental cultural change led by management.`,
      severity: "critical",
    });
  }

  if (seriousNearMissRate > 40 && totalNearMisses > 0) {
    insights.push({
      text: `${seriousNearMissRate}% of near misses have serious or catastrophic potential severity. The home is experiencing a concerning proportion of high-severity near misses that could have resulted in significant harm. This pattern demands urgent management attention and specialist safety review.`,
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (
    hazardResolutionRate >= 50 &&
    hazardResolutionRate < 70 &&
    totalHazardReports > 0
  ) {
    insights.push({
      text: `Hazard resolution rate at ${hazardResolutionRate}% — improving but still leaving a significant proportion of identified hazards unresolved. The home needs to strengthen its hazard closure process to reduce the backlog of open issues.`,
      severity: "warning",
    });
  }

  if (
    nearMissInvestigationRate >= 50 &&
    nearMissInvestigationRate < 70 &&
    totalNearMisses > 0
  ) {
    insights.push({
      text: `Near miss investigation rate at ${nearMissInvestigationRate}% — some near misses are being investigated but the rate needs to improve. Every uninvestigated near miss is a missed opportunity to prevent a future incident.`,
      severity: "warning",
    });
  }

  if (
    overdueActionRate > 20 &&
    overdueActionRate <= 40 &&
    totalCorrectiveActions > 0
  ) {
    insights.push({
      text: `${overdueActionRate}% of corrective actions are overdue — while not at critical levels, overdue actions indicate weaknesses in the action management system. Prolonged delays in safety actions erode the effectiveness of the whole corrective process.`,
      severity: "warning",
    });
  }

  if (
    timelyReportingRate >= 50 &&
    timelyReportingRate < 70 &&
    totalNearMisses > 0
  ) {
    insights.push({
      text: `Timely near miss reporting at ${timelyReportingRate}% — delays in reporting can mean evidence is lost, memories fade, and contributing conditions change. The home should aim for at least 80% of near misses reported within 24 hours.`,
      severity: "warning",
    });
  }

  if (
    rootCauseRate >= 50 &&
    rootCauseRate < 70 &&
    totalIncidentLearnings > 0
  ) {
    insights.push({
      text: `Root cause identification at ${rootCauseRate}% — some reviews are reaching root causes but others are stopping at surface findings. Consider providing structured root cause analysis training to those conducting reviews.`,
      severity: "warning",
    });
  }

  if (
    lessonSharingRate >= 50 &&
    lessonSharingRate < 70 &&
    totalIncidentLearnings > 0
  ) {
    insights.push({
      text: `Lesson sharing rate at ${lessonSharingRate}% — learnings from some incidents are reaching the team but not consistently. Organisational learning requires systematic dissemination through multiple channels.`,
      severity: "warning",
    });
  }

  if (
    walkActionCompletionRate >= 50 &&
    walkActionCompletionRate < 70 &&
    totalWalkActionsRaised > 0
  ) {
    insights.push({
      text: `Safety walk action completion at ${walkActionCompletionRate}% — while walks are identifying issues, not all are being resolved. Uncompleted walk actions reduce the credibility and value of the safety walk programme.`,
      severity: "warning",
    });
  }

  if (
    riskAssessmentCompletionRate >= 50 &&
    riskAssessmentCompletionRate < 70 &&
    totalHazardReports > 0
  ) {
    insights.push({
      text: `Risk assessment completion at ${riskAssessmentCompletionRate}% — not all hazards are being formally risk assessed. Without consistent risk assessment, the home cannot prioritise hazards effectively or demonstrate systematic risk management.`,
      severity: "warning",
    });
  }

  if (
    childDebriefRate >= 50 &&
    childDebriefRate < 70 &&
    totalIncidentLearnings > 0
  ) {
    insights.push({
      text: `Child debrief completion at ${childDebriefRate}% — not all children are being debriefed after incidents. Children who experience safety events need the opportunity to express their feelings and understand what is being done to keep them safe.`,
      severity: "warning",
    });
  }

  if (
    effectivenessVerificationRate >= 50 &&
    effectivenessVerificationRate < 70 &&
    totalCorrectiveActions > 0
  ) {
    insights.push({
      text: `Action effectiveness verification at ${effectivenessVerificationRate}% — some completed actions are being verified but not consistently. Without verification, the home does not know whether closed actions have actually improved safety.`,
      severity: "warning",
    });
  }

  if (
    recurrenceRate > 15 &&
    recurrenceRate <= 30 &&
    totalHazardReports > 0
  ) {
    insights.push({
      text: `Hazard recurrence rate at ${recurrenceRate}% — some hazards are reappearing after initial resolution. Consider whether fixes are addressing root causes or merely providing temporary solutions that allow the hazard to return.`,
      severity: "warning",
    });
  }

  if (
    staffEngagementRate >= 50 &&
    staffEngagementRate < 65
  ) {
    insights.push({
      text: `Staff engagement in safety reporting at ${staffEngagementRate}% — staff participation is below optimal levels. A safety culture requires every team member to feel empowered and accountable for identifying and reporting hazards.`,
      severity: "warning",
    });
  }

  if (
    actualRecurrenceRate > 15 &&
    actualRecurrenceRate <= 30 &&
    totalIncidentLearnings > 0
  ) {
    insights.push({
      text: `Incident recurrence rate at ${actualRecurrenceRate}% — some incidents continue to recur despite learning reviews. Review whether corrective actions are sufficiently robust and whether systemic factors are being addressed.`,
      severity: "warning",
    });
  }

  // Hazard type analysis
  const hazardTypeMap: Record<string, number> = {};
  for (const h of hazard_report_records) {
    hazardTypeMap[h.hazard_type] = (hazardTypeMap[h.hazard_type] ?? 0) + 1;
  }
  const topHazardTypes = Object.entries(hazardTypeMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topHazardTypes.length > 0) {
    const formatted = topHazardTypes
      .map(([type, count]) => `${type.replace(/_/g, " ")} (${count})`)
      .join(", ");
    insights.push({
      text: `Most common hazard types: ${formatted}. Analysing hazard patterns enables targeted environmental improvements and staff training. Recurring hazard categories may indicate systemic premises issues requiring capital investment or design changes.`,
      severity: "warning",
    });
  }

  // Near miss type analysis
  const topNearMissTypes = Object.entries(nearMissTypes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topNearMissTypes.length > 0) {
    const formatted = topNearMissTypes
      .map(([type, count]) => `${type.replace(/_/g, " ")} (${count})`)
      .join(", ");
    insights.push({
      text: `Most common near miss types: ${formatted}. Near miss patterns are the strongest predictor of future incidents. Concentrated near miss types indicate specific areas where intervention could prevent harm.`,
      severity: "warning",
    });
  }

  // Location analysis for hazards
  const locationMap: Record<string, number> = {};
  for (const h of hazard_report_records) {
    if (h.location) {
      locationMap[h.location] = (locationMap[h.location] ?? 0) + 1;
    }
  }
  const topLocations = Object.entries(locationMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topLocations.length >= 2) {
    const formatted = topLocations
      .map(([loc, count]) => `${loc} (${count})`)
      .join(", ");
    insights.push({
      text: `Hazard hotspot locations: ${formatted}. Concentrated hazard reporting in specific areas may indicate environmental design issues, maintenance deficiencies, or high-risk activity zones requiring targeted risk control.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (hazard_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding hazard identification and near miss reporting — a proactive safety culture exists where hazards are promptly identified, near misses are investigated, corrective actions are effective, safety walks are thorough, and the team learns from every incident. This is strong evidence for Reg 25 and Reg 5 compliance.",
      severity: "positive",
    });
  }

  if (
    hazardReportingRate >= 85 &&
    nearMissTrackingRate >= 85 &&
    totalHazardReports > 0 &&
    totalNearMisses > 0
  ) {
    insights.push({
      text: `${hazardReportingRate}% hazard reporting quality with ${nearMissTrackingRate}% near miss tracking — the combination of high-quality hazard management and thorough near miss investigation demonstrates a mature safety reporting system that captures and acts on both active hazards and early warning signals.`,
      severity: "positive",
    });
  }

  if (
    correctiveActionRate >= 85 &&
    recurrencePreventionRate >= 90 &&
    totalCorrectiveActions > 0
  ) {
    insights.push({
      text: `${correctiveActionRate}% corrective action effectiveness with ${recurrencePreventionRate}% recurrence prevention — completed actions are not just administratively closed but are genuinely preventing hazards from recurring. This demonstrates that the corrective action process is fit for purpose.`,
      severity: "positive",
    });
  }

  if (
    safetyWalkRate >= 85 &&
    walkActionCompletionRate >= 90 &&
    totalSafetyWalks > 0
  ) {
    insights.push({
      text: `${safetyWalkRate}% safety walk compliance with ${walkActionCompletionRate}% action completion — management safety walks are thorough and identified issues are followed through. This evidences strong management oversight of premises safety as required by Reg 25 and Reg 5.`,
      severity: "positive",
    });
  }

  if (
    incidentLearningRate >= 85 &&
    rootCauseRate >= 90 &&
    totalIncidentLearnings > 0
  ) {
    insights.push({
      text: `${incidentLearningRate}% incident learning quality with ${rootCauseRate}% root cause identification — the home consistently identifies underlying causes, shares learnings, and implements effective improvements. This creates a virtuous cycle of continuous safety improvement.`,
      severity: "positive",
    });
  }

  if (staffEngagementRate >= 85) {
    insights.push({
      text: `${staffEngagementRate}% staff engagement in safety reporting — a strong safety culture is evident where staff actively participate in hazard escalation, near miss sharing, safety walks, and incident learning. Ofsted values evidence that safety is everyone's responsibility.`,
      severity: "positive",
    });
  }

  if (
    timelyReportingRate >= 90 &&
    nearMissImmediateActionRate >= 90 &&
    totalNearMisses > 0
  ) {
    insights.push({
      text: `${timelyReportingRate}% timely reporting with ${nearMissImmediateActionRate}% immediate action on near misses — the home's rapid response to near misses demonstrates a culture where safety events are taken seriously and acted upon without delay.`,
      severity: "positive",
    });
  }

  if (
    childDebriefRate >= 80 &&
    walkChildConsultationRate >= 80 &&
    totalIncidentLearnings > 0 &&
    totalSafetyWalks > 0
  ) {
    insights.push({
      text: `${childDebriefRate}% child debrief completion and ${walkChildConsultationRate}% child consultation during safety walks — children's voices are consistently included in both incident response and proactive safety assessment, demonstrating that the home values and acts on children's perspectives about their own safety.`,
      severity: "positive",
    });
  }

  if (
    reporterDiversity >= 3 &&
    totalHazardReports > 0
  ) {
    insights.push({
      text: `Hazard reports from ${reporterDiversity} different role types — an inclusive reporting culture exists where not just designated staff but multiple groups contribute to hazard identification. Ofsted values evidence that everyone in the home's community can raise safety concerns.`,
      severity: "positive",
    });
  }

  if (
    improvementEffectivenessRate >= 90 &&
    improvementActionCompleted > 0
  ) {
    insights.push({
      text: `${improvementEffectivenessRate}% improvement action effectiveness — actions taken following incident learning are consistently achieving their intended safety improvements. The home's learning cycle translates insights into real, measurable safety gains.`,
      severity: "positive",
    });
  }

  if (
    avgWalkComplianceScore >= 4.0 &&
    totalSafetyWalks > 0
  ) {
    insights.push({
      text: `Average safety walk compliance score of ${avgWalkComplianceScore}/5 — the premises consistently achieve high safety standards during formal inspections, demonstrating that the physical environment is well maintained and safe for children.`,
      severity: "positive",
    });
  }

  if (
    lessonSharingRate >= 90 &&
    trainingDeliveryRate >= 90 &&
    totalIncidentLearnings > 0 &&
    trainingNeedIdentified > 0
  ) {
    insights.push({
      text: `${lessonSharingRate}% lesson sharing with ${trainingDeliveryRate}% training delivery — the home not only identifies and shares learnings but ensures identified training needs are delivered. This comprehensive learning loop builds staff competency and reduces risk.`,
      severity: "positive",
    });
  }

  if (
    onTimeCompletionRate >= 90 &&
    actionsCompleted > 0
  ) {
    insights.push({
      text: `${onTimeCompletionRate}% on-time corrective action completion — safety actions are completed within agreed timescales, demonstrating disciplined accountability and effective management oversight of the corrective action process.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (hazard_rating === "outstanding") {
    headline =
      "Outstanding hazard identification and near miss reporting — a proactive safety culture exists with effective hazard management, thorough investigation, and genuine learning from incidents.";
  } else if (hazard_rating === "good") {
    headline = `Good hazard identification and near miss reporting — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (hazard_rating === "adequate") {
    headline = `Adequate hazard identification and near miss reporting — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure a robust safety reporting culture.`;
  } else {
    headline = `Hazard identification and near miss reporting is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to establish an effective safety reporting culture.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    hazard_rating,
    hazard_score: score,
    headline,
    total_hazard_reports: totalHazardReports,
    total_near_misses: totalNearMisses,
    total_corrective_actions: totalCorrectiveActions,
    total_safety_walks: totalSafetyWalks,
    total_incident_learnings: totalIncidentLearnings,
    hazard_reporting_rate: hazardReportingRate,
    near_miss_tracking_rate: nearMissTrackingRate,
    corrective_action_rate: correctiveActionRate,
    safety_walk_rate: safetyWalkRate,
    incident_learning_rate: incidentLearningRate,
    staff_engagement_rate: staffEngagementRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
