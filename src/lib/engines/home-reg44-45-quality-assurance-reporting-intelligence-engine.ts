// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME REG 44/45 QUALITY ASSURANCE REPORTING INTELLIGENCE ENGINE
// Monitors the quality and timeliness of the home's Regulation 44 independent
// visitor reports, Regulation 45 quality-of-care reviews, action plan tracking
// and closure, quality improvement cycle effectiveness, Ofsted notification
// compliance, and stakeholder engagement in quality assurance processes.
// Measures Reg 44 completion, Reg 45 timeliness, action plan resolution,
// quality improvement cycles, notification compliance, stakeholder engagement.
// Pure deterministic engine — no imports, no LLM, no external deps.
// Ofsted CHR 2015 Reg 44 (Independent person: visits and reports),
// Reg 45 (Review of quality of care).
// SCCIF: Leadership and management — "Leaders and managers are ambitious ...
// they have effective quality assurance systems that identify and act on areas
// for improvement."
// Store keys: reg44ReportRecords, reg45ReviewRecords, actionPlanRecords,
//             qualityImprovementRecords, notificationRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface Reg44ReportInput {
  id: string;
  visit_date: string;
  visitor_name: string;
  visitor_independent: boolean;
  report_submitted: boolean;
  report_submission_date: string | null;
  submitted_within_deadline: boolean;
  report_shared_with_ofsted: boolean;
  report_shared_with_placing_authorities: boolean;
  children_spoken_to: number;
  children_available: number;
  staff_interviewed: number;
  areas_inspected: string[];
  shortfalls_identified: number;
  shortfalls_actioned: number;
  positive_observations: number;
  previous_actions_reviewed: boolean;
  previous_actions_resolved: number;
  previous_actions_total: number;
  report_quality_rating: number; // 1-5
  child_views_captured: boolean;
  night_visit_included: boolean;
  unannounced: boolean;
  medication_records_checked: boolean;
  sanctions_records_checked: boolean;
  complaints_reviewed: boolean;
  safeguarding_reviewed: boolean;
  created_at: string;
}

export interface Reg45ReviewInput {
  id: string;
  review_period_start: string;
  review_period_end: string;
  review_date: string;
  completed_on_time: boolean;
  reviewer_name: string;
  reviewer_role: string;
  review_covers_all_standards: boolean;
  development_plan_updated: boolean;
  reg44_reports_considered: number;
  reg44_reports_available: number;
  children_consulted: number;
  children_total: number;
  staff_consulted: number;
  placing_authorities_consulted: number;
  parents_carers_consulted: number;
  professionals_consulted: number;
  strengths_identified: number;
  areas_for_improvement_identified: number;
  actions_set: number;
  actions_from_previous_review_completed: number;
  actions_from_previous_review_total: number;
  review_quality_rating: number; // 1-5
  shared_with_ofsted: boolean;
  shared_with_placing_authorities: boolean;
  created_at: string;
}

export interface ActionPlanInput {
  id: string;
  source: "reg44" | "reg45" | "ofsted" | "complaint" | "incident" | "internal_audit" | "staff_feedback" | "other";
  source_id: string;
  action_description: string;
  assigned_to: string;
  date_raised: string;
  target_completion_date: string;
  actual_completion_date: string | null;
  status: "open" | "in_progress" | "completed" | "overdue" | "escalated" | "cancelled";
  priority: "critical" | "high" | "medium" | "low";
  evidence_of_completion: boolean;
  verified_by_manager: boolean;
  impact_on_children_assessed: boolean;
  follow_up_required: boolean;
  follow_up_completed: boolean;
  created_at: string;
}

export interface QualityImprovementInput {
  id: string;
  cycle_name: string;
  cycle_start_date: string;
  cycle_end_date: string | null;
  status: "planning" | "implementing" | "reviewing" | "completed" | "abandoned";
  identified_issue: string;
  improvement_goal: string;
  baseline_measure: number; // 0-100
  current_measure: number; // 0-100
  target_measure: number; // 0-100
  actions_planned: number;
  actions_completed: number;
  staff_involved: number;
  children_consulted: boolean;
  evidence_collected: boolean;
  outcome_measured: boolean;
  improvement_achieved: boolean;
  sustained_over_time: boolean;
  linked_to_reg44_finding: boolean;
  linked_to_reg45_finding: boolean;
  created_at: string;
}

export interface NotificationInput {
  id: string;
  notification_type: "serious_event" | "death" | "serious_illness" | "serious_injury" | "allegation" | "child_missing" | "police_involvement" | "fire" | "serious_complaint" | "absconding" | "restraint" | "other";
  event_date: string;
  notification_date: string;
  notified_within_24_hours: boolean;
  notified_ofsted: boolean;
  notified_placing_authority: boolean;
  notified_local_authority: boolean;
  follow_up_report_required: boolean;
  follow_up_report_submitted: boolean;
  follow_up_submitted_on_time: boolean;
  investigation_completed: boolean;
  actions_arising: number;
  actions_completed: number;
  child_id: string;
  child_informed_of_outcome: boolean;
  documented_in_records: boolean;
  created_at: string;
}

export interface Reg4445QualityAssuranceReportingInput {
  today: string;
  total_children: number;
  reg44_report_records: Reg44ReportInput[];
  reg45_review_records: Reg45ReviewInput[];
  action_plan_records: ActionPlanInput[];
  quality_improvement_records: QualityImprovementInput[];
  notification_records: NotificationInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type Reg4445QualityRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface Reg4445QualityInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface Reg4445QualityRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface Reg4445QualityAssuranceReportingResult {
  quality_assurance_rating: Reg4445QualityRating;
  quality_assurance_score: number;
  headline: string;
  total_reg44_reports: number;
  total_reg45_reviews: number;
  total_action_plans: number;
  total_quality_cycles: number;
  total_notifications: number;
  reg44_completion_rate: number;
  reg45_timeliness_rate: number;
  action_plan_rate: number;
  quality_improvement_rate: number;
  notification_compliance_rate: number;
  stakeholder_engagement_rate: number;
  reg44_quality_avg: number;
  reg45_quality_avg: number;
  action_plan_overdue_count: number;
  action_plan_escalated_count: number;
  strengths: string[];
  concerns: string[];
  recommendations: Reg4445QualityRecommendation[];
  insights: Reg4445QualityInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): Reg4445QualityRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: Reg4445QualityRating,
  score: number,
  headline: string,
): Reg4445QualityAssuranceReportingResult {
  return {
    quality_assurance_rating: rating,
    quality_assurance_score: score,
    headline,
    total_reg44_reports: 0,
    total_reg45_reviews: 0,
    total_action_plans: 0,
    total_quality_cycles: 0,
    total_notifications: 0,
    reg44_completion_rate: 0,
    reg45_timeliness_rate: 0,
    action_plan_rate: 0,
    quality_improvement_rate: 0,
    notification_compliance_rate: 0,
    stakeholder_engagement_rate: 0,
    reg44_quality_avg: 0,
    reg45_quality_avg: 0,
    action_plan_overdue_count: 0,
    action_plan_escalated_count: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeReg4445QualityAssuranceReporting(
  input: Reg4445QualityAssuranceReportingInput,
): Reg4445QualityAssuranceReportingResult {
  const {
    total_children,
    reg44_report_records,
    reg45_review_records,
    action_plan_records,
    quality_improvement_records,
    notification_records,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    reg44_report_records.length === 0 &&
    reg45_review_records.length === 0 &&
    action_plan_records.length === 0 &&
    quality_improvement_records.length === 0 &&
    notification_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess Reg 44/45 quality assurance reporting.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No Reg 44 reports, Reg 45 reviews, action plans, quality improvement records, or notification records exist despite children being on placement — quality assurance and regulatory compliance require urgent attention.",
      ),
      concerns: [
        "No Regulation 44 independent visitor reports, Regulation 45 quality-of-care reviews, action plans, quality improvement cycles, or Ofsted notification records exist despite children being on placement — the home cannot demonstrate any quality assurance oversight or regulatory compliance.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Arrange immediate independent visitor appointment and schedule monthly Regulation 44 visits — the absence of any Reg 44 reports is a fundamental breach of the Children's Homes Regulations 2015.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 44 — Independent person: visits and reports",
        },
        {
          rank: 2,
          recommendation:
            "Conduct a Regulation 45 quality-of-care review immediately and establish a six-monthly review cycle — the registered person must review the quality of care provided at least every six months.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 45 — Review of quality of care",
        },
      ],
      insights: [
        {
          text: "The complete absence of Reg 44 and Reg 45 records means the home cannot demonstrate independent oversight or systematic quality review. Ofsted will view this as a fundamental failure of leadership and management — Reg 44 visits and Reg 45 reviews are statutory requirements, and their absence indicates the home lacks the most basic quality assurance framework.",
          severity: "critical",
        },
      ],
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // COMPUTE CORE METRICS
  // ══════════════════════════════════════════════════════════════════════════

  // ── Reg 44 Metrics ────────────────────────────────────────────────────

  const totalReg44 = reg44_report_records.length;
  const submittedReg44 = reg44_report_records.filter(
    (r) => r.report_submitted,
  ).length;
  const reg44CompletionRate = pct(submittedReg44, totalReg44);

  const withinDeadlineReg44 = reg44_report_records.filter(
    (r) => r.report_submitted && r.submitted_within_deadline,
  ).length;
  const reg44TimelinessRate = pct(withinDeadlineReg44, submittedReg44);

  const sharedWithOfstedReg44 = reg44_report_records.filter(
    (r) => r.report_submitted && r.report_shared_with_ofsted,
  ).length;
  const reg44OfstedSharingRate = pct(sharedWithOfstedReg44, submittedReg44);

  const sharedWithPlacingAuthReg44 = reg44_report_records.filter(
    (r) => r.report_submitted && r.report_shared_with_placing_authorities,
  ).length;
  const reg44PlacingAuthSharingRate = pct(sharedWithPlacingAuthReg44, submittedReg44);

  const independentVisitors = reg44_report_records.filter(
    (r) => r.visitor_independent,
  ).length;
  const independenceRate = pct(independentVisitors, totalReg44);

  const childViewsCaptured = reg44_report_records.filter(
    (r) => r.child_views_captured,
  ).length;
  const reg44ChildViewsRate = pct(childViewsCaptured, totalReg44);

  const unannouncedVisits = reg44_report_records.filter(
    (r) => r.unannounced,
  ).length;
  const unannouncedRate = pct(unannouncedVisits, totalReg44);

  const nightVisits = reg44_report_records.filter(
    (r) => r.night_visit_included,
  ).length;
  const nightVisitRate = pct(nightVisits, totalReg44);

  const previousActionsReviewed = reg44_report_records.filter(
    (r) => r.previous_actions_reviewed,
  ).length;
  const previousActionsReviewedRate = pct(previousActionsReviewed, totalReg44);

  const reg44QualitySum = reg44_report_records
    .filter((r) => r.report_submitted)
    .reduce((sum, r) => sum + r.report_quality_rating, 0);
  const reg44QualityAvg =
    submittedReg44 > 0
      ? Math.round((reg44QualitySum / submittedReg44) * 100) / 100
      : 0;

  const totalShortfallsIdentified = reg44_report_records.reduce(
    (sum, r) => sum + r.shortfalls_identified,
    0,
  );
  const totalShortfallsActioned = reg44_report_records.reduce(
    (sum, r) => sum + r.shortfalls_actioned,
    0,
  );
  const shortfallActionRate = pct(totalShortfallsActioned, totalShortfallsIdentified);

  const totalPrevActionsResolved = reg44_report_records.reduce(
    (sum, r) => sum + r.previous_actions_resolved,
    0,
  );
  const totalPrevActionsTotal = reg44_report_records.reduce(
    (sum, r) => sum + r.previous_actions_total,
    0,
  );
  const prevActionResolutionRate = pct(totalPrevActionsResolved, totalPrevActionsTotal);

  const medicationChecked = reg44_report_records.filter(
    (r) => r.medication_records_checked,
  ).length;
  const sanctionsChecked = reg44_report_records.filter(
    (r) => r.sanctions_records_checked,
  ).length;
  const complaintsReviewed = reg44_report_records.filter(
    (r) => r.complaints_reviewed,
  ).length;
  const safeguardingReviewed = reg44_report_records.filter(
    (r) => r.safeguarding_reviewed,
  ).length;
  const recordsCheckRate = pct(
    medicationChecked + sanctionsChecked + complaintsReviewed + safeguardingReviewed,
    totalReg44 * 4,
  );

  const totalChildrenSpokenTo = reg44_report_records.reduce(
    (sum, r) => sum + r.children_spoken_to,
    0,
  );
  const totalChildrenAvailable = reg44_report_records.reduce(
    (sum, r) => sum + r.children_available,
    0,
  );
  const childrenSpokenToRate = pct(totalChildrenSpokenTo, totalChildrenAvailable);

  // ── Reg 45 Metrics ────────────────────────────────────────────────────

  const totalReg45 = reg45_review_records.length;
  const onTimeReg45 = reg45_review_records.filter(
    (r) => r.completed_on_time,
  ).length;
  const reg45TimelinessRate = pct(onTimeReg45, totalReg45);

  const coversAllStandards = reg45_review_records.filter(
    (r) => r.review_covers_all_standards,
  ).length;
  const reg45CoverageRate = pct(coversAllStandards, totalReg45);

  const devPlanUpdated = reg45_review_records.filter(
    (r) => r.development_plan_updated,
  ).length;
  const devPlanUpdateRate = pct(devPlanUpdated, totalReg45);

  const reg45SharedOfsted = reg45_review_records.filter(
    (r) => r.shared_with_ofsted,
  ).length;
  const reg45OfstedSharingRate = pct(reg45SharedOfsted, totalReg45);

  const reg45SharedPlacingAuth = reg45_review_records.filter(
    (r) => r.shared_with_placing_authorities,
  ).length;
  const reg45PlacingAuthSharingRate = pct(reg45SharedPlacingAuth, totalReg45);

  const reg45QualitySum = reg45_review_records.reduce(
    (sum, r) => sum + r.review_quality_rating,
    0,
  );
  const reg45QualityAvg =
    totalReg45 > 0
      ? Math.round((reg45QualitySum / totalReg45) * 100) / 100
      : 0;

  const totalChildrenConsultedReg45 = reg45_review_records.reduce(
    (sum, r) => sum + r.children_consulted,
    0,
  );
  const totalChildrenTotalReg45 = reg45_review_records.reduce(
    (sum, r) => sum + r.children_total,
    0,
  );
  const reg45ChildConsultationRate = pct(totalChildrenConsultedReg45, totalChildrenTotalReg45);

  const totalStaffConsulted = reg45_review_records.reduce(
    (sum, r) => sum + r.staff_consulted,
    0,
  );
  const totalPlacingAuthConsulted = reg45_review_records.reduce(
    (sum, r) => sum + r.placing_authorities_consulted,
    0,
  );
  const totalParentsConsulted = reg45_review_records.reduce(
    (sum, r) => sum + r.parents_carers_consulted,
    0,
  );
  const totalProfessionalsConsulted = reg45_review_records.reduce(
    (sum, r) => sum + r.professionals_consulted,
    0,
  );

  const totalReg44Considered = reg45_review_records.reduce(
    (sum, r) => sum + r.reg44_reports_considered,
    0,
  );
  const totalReg44Available = reg45_review_records.reduce(
    (sum, r) => sum + r.reg44_reports_available,
    0,
  );
  const reg44ConsideredInReg45Rate = pct(totalReg44Considered, totalReg44Available);

  const reg45PreviousActionsCompleted = reg45_review_records.reduce(
    (sum, r) => sum + r.actions_from_previous_review_completed,
    0,
  );
  const reg45PreviousActionsTotal = reg45_review_records.reduce(
    (sum, r) => sum + r.actions_from_previous_review_total,
    0,
  );
  const reg45PrevActionRate = pct(reg45PreviousActionsCompleted, reg45PreviousActionsTotal);

  // ── Stakeholder engagement composite ──────────────────────────────────

  const totalStakeholderTouchpoints =
    totalChildrenConsultedReg45 +
    totalStaffConsulted +
    totalPlacingAuthConsulted +
    totalParentsConsulted +
    totalProfessionalsConsulted;

  const maxStakeholderTouchpoints =
    totalChildrenTotalReg45 +
    (totalReg45 > 0 ? totalReg45 * 3 : 0) + // expect >= 3 staff per review
    (totalReg45 > 0 ? totalReg45 * 1 : 0) + // expect >= 1 placing auth per review
    (totalReg45 > 0 ? totalReg45 * 1 : 0) + // expect >= 1 parent/carer per review
    (totalReg45 > 0 ? totalReg45 * 1 : 0);  // expect >= 1 professional per review

  const stakeholderEngagementRate = pct(totalStakeholderTouchpoints, maxStakeholderTouchpoints);

  // ── Action Plan Metrics ───────────────────────────────────────────────

  const totalActionPlans = action_plan_records.length;
  const completedActions = action_plan_records.filter(
    (a) => a.status === "completed",
  ).length;
  const overdueActions = action_plan_records.filter(
    (a) => a.status === "overdue",
  ).length;
  const escalatedActions = action_plan_records.filter(
    (a) => a.status === "escalated",
  ).length;
  const cancelledActions = action_plan_records.filter(
    (a) => a.status === "cancelled",
  ).length;

  const actionableActions = totalActionPlans - cancelledActions;
  const actionPlanRate = pct(completedActions, actionableActions);

  const verifiedByManager = action_plan_records.filter(
    (a) => a.status === "completed" && a.verified_by_manager,
  ).length;
  const managerVerificationRate = pct(verifiedByManager, completedActions);

  const evidenceOfCompletion = action_plan_records.filter(
    (a) => a.status === "completed" && a.evidence_of_completion,
  ).length;
  const evidenceRate = pct(evidenceOfCompletion, completedActions);

  const impactAssessed = action_plan_records.filter(
    (a) => a.impact_on_children_assessed,
  ).length;
  const impactAssessmentRate = pct(impactAssessed, totalActionPlans);

  const followUpRequired = action_plan_records.filter(
    (a) => a.follow_up_required,
  ).length;
  const followUpCompleted = action_plan_records.filter(
    (a) => a.follow_up_required && a.follow_up_completed,
  ).length;
  const followUpRate = pct(followUpCompleted, followUpRequired);

  const criticalActions = action_plan_records.filter(
    (a) => a.priority === "critical",
  ).length;
  const criticalCompleted = action_plan_records.filter(
    (a) => a.priority === "critical" && a.status === "completed",
  ).length;
  const criticalOverdue = action_plan_records.filter(
    (a) => a.priority === "critical" && a.status === "overdue",
  ).length;
  const criticalCompletionRate = pct(criticalCompleted, criticalActions);

  const actionsBySource: Record<string, number> = {};
  for (const ap of action_plan_records) {
    actionsBySource[ap.source] = (actionsBySource[ap.source] ?? 0) + 1;
  }

  // ── Quality Improvement Metrics ───────────────────────────────────────

  const totalQualityCycles = quality_improvement_records.length;
  const completedCycles = quality_improvement_records.filter(
    (q) => q.status === "completed",
  ).length;
  const abandonedCycles = quality_improvement_records.filter(
    (q) => q.status === "abandoned",
  ).length;

  const improvementAchieved = quality_improvement_records.filter(
    (q) => q.improvement_achieved,
  ).length;
  const qualityImprovementRate = pct(improvementAchieved, totalQualityCycles);

  const sustainedImprovement = quality_improvement_records.filter(
    (q) => q.improvement_achieved && q.sustained_over_time,
  ).length;
  const sustainedImprovementRate = pct(sustainedImprovement, improvementAchieved);

  const outcomeMeasured = quality_improvement_records.filter(
    (q) => q.outcome_measured,
  ).length;
  const outcomeMeasurementRate = pct(outcomeMeasured, totalQualityCycles);

  const evidenceCollected = quality_improvement_records.filter(
    (q) => q.evidence_collected,
  ).length;
  const evidenceCollectionRate = pct(evidenceCollected, totalQualityCycles);

  const childrenConsultedInCycles = quality_improvement_records.filter(
    (q) => q.children_consulted,
  ).length;
  const cycleChildConsultationRate = pct(childrenConsultedInCycles, totalQualityCycles);

  const linkedToReg44 = quality_improvement_records.filter(
    (q) => q.linked_to_reg44_finding,
  ).length;
  const linkedToReg45 = quality_improvement_records.filter(
    (q) => q.linked_to_reg45_finding,
  ).length;
  const linkedToRegFindings = pct(linkedToReg44 + linkedToReg45, totalQualityCycles);

  const cycleActionsPlanned = quality_improvement_records.reduce(
    (sum, q) => sum + q.actions_planned,
    0,
  );
  const cycleActionsCompleted = quality_improvement_records.reduce(
    (sum, q) => sum + q.actions_completed,
    0,
  );
  const cycleActionCompletionRate = pct(cycleActionsCompleted, cycleActionsPlanned);

  const improvementProgressValues = quality_improvement_records
    .filter((q) => q.target_measure > q.baseline_measure)
    .map((q) => {
      const range = q.target_measure - q.baseline_measure;
      const progress = q.current_measure - q.baseline_measure;
      return clamp(Math.round((progress / range) * 100), 0, 100);
    });
  const avgImprovementProgress =
    improvementProgressValues.length > 0
      ? Math.round(
          improvementProgressValues.reduce((sum, v) => sum + v, 0) /
            improvementProgressValues.length,
        )
      : 0;

  // ── Notification Metrics ──────────────────────────────────────────────

  const totalNotifications = notification_records.length;
  const notifiedWithin24hrs = notification_records.filter(
    (n) => n.notified_within_24_hours,
  ).length;
  const notificationTimelinessRate = pct(notifiedWithin24hrs, totalNotifications);

  const notifiedOfsted = notification_records.filter(
    (n) => n.notified_ofsted,
  ).length;
  const ofstedNotificationRate = pct(notifiedOfsted, totalNotifications);

  const notifiedPlacingAuth = notification_records.filter(
    (n) => n.notified_placing_authority,
  ).length;
  const placingAuthNotificationRate = pct(notifiedPlacingAuth, totalNotifications);

  const notifiedLocalAuth = notification_records.filter(
    (n) => n.notified_local_authority,
  ).length;
  const localAuthNotificationRate = pct(notifiedLocalAuth, totalNotifications);

  const followUpReportsRequired = notification_records.filter(
    (n) => n.follow_up_report_required,
  ).length;
  const followUpReportsSubmitted = notification_records.filter(
    (n) => n.follow_up_report_required && n.follow_up_report_submitted,
  ).length;
  const followUpReportRate = pct(followUpReportsSubmitted, followUpReportsRequired);

  const followUpOnTime = notification_records.filter(
    (n) => n.follow_up_report_required && n.follow_up_submitted_on_time,
  ).length;
  const followUpOnTimeRate = pct(followUpOnTime, followUpReportsRequired);

  const investigationsCompleted = notification_records.filter(
    (n) => n.investigation_completed,
  ).length;
  const investigationCompletionRate = pct(investigationsCompleted, totalNotifications);

  const childInformedOfOutcome = notification_records.filter(
    (n) => n.child_informed_of_outcome,
  ).length;
  const childInformedRate = pct(childInformedOfOutcome, totalNotifications);

  const documentedInRecords = notification_records.filter(
    (n) => n.documented_in_records,
  ).length;
  const documentationRate = pct(documentedInRecords, totalNotifications);

  const notificationActionsTotal = notification_records.reduce(
    (sum, n) => sum + n.actions_arising,
    0,
  );
  const notificationActionsCompleted = notification_records.reduce(
    (sum, n) => sum + n.actions_completed,
    0,
  );
  const notificationActionRate = pct(notificationActionsCompleted, notificationActionsTotal);

  // Composite notification compliance
  const notificationComplianceRate =
    totalNotifications > 0
      ? Math.round(
          (notificationTimelinessRate +
            ofstedNotificationRate +
            documentationRate) /
            3,
        )
      : 0;

  // ══════════════════════════════════════════════════════════════════════════
  // SCORING: base = 52, max bonuses = +28, 4 guarded penalties
  // ══════════════════════════════════════════════════════════════════════════

  let score = 52;

  // --- Bonus 1: reg44CompletionRate (>=100: +5, >=80: +3) ---
  if (reg44CompletionRate >= 100) score += 5;
  else if (reg44CompletionRate >= 80) score += 3;

  // --- Bonus 2: reg45TimelinessRate (>=100: +5, >=80: +3) ---
  if (reg45TimelinessRate >= 100) score += 5;
  else if (reg45TimelinessRate >= 80) score += 3;

  // --- Bonus 3: actionPlanRate (>=90: +5, >=70: +3) ---
  if (actionPlanRate >= 90) score += 5;
  else if (actionPlanRate >= 70) score += 3;

  // --- Bonus 4: qualityImprovementRate (>=80: +4, >=60: +2) ---
  if (qualityImprovementRate >= 80) score += 4;
  else if (qualityImprovementRate >= 60) score += 2;

  // --- Bonus 5: notificationComplianceRate (>=95: +5, >=80: +3) ---
  if (notificationComplianceRate >= 95) score += 5;
  else if (notificationComplianceRate >= 80) score += 3;

  // --- Bonus 6: stakeholderEngagementRate (>=80: +4, >=60: +2) ---
  if (stakeholderEngagementRate >= 80) score += 4;
  else if (stakeholderEngagementRate >= 60) score += 2;

  // ── Penalties (4 guarded) ─────────────────────────────────────────────

  // Penalty 1: reg44CompletionRate < 50 → -6
  if (reg44CompletionRate < 50 && totalReg44 > 0) score -= 6;

  // Penalty 2: reg45TimelinessRate < 50 → -6
  if (reg45TimelinessRate < 50 && totalReg45 > 0) score -= 6;

  // Penalty 3: actionPlanRate < 40 → -5
  if (actionPlanRate < 40 && actionableActions > 0) score -= 5;

  // Penalty 4: notificationComplianceRate < 50 → -5
  if (notificationComplianceRate < 50 && totalNotifications > 0) score -= 5;

  score = clamp(score, 0, 100);

  const quality_assurance_rating = toRating(score);

  // ══════════════════════════════════════════════════════════════════════════
  // STRENGTHS
  // ══════════════════════════════════════════════════════════════════════════

  const strengths: string[] = [];

  if (reg44CompletionRate >= 100 && totalReg44 > 0) {
    strengths.push(
      "Every Regulation 44 independent visitor report has been submitted — the home maintains complete compliance with statutory monthly visit requirements.",
    );
  } else if (reg44CompletionRate >= 80 && totalReg44 > 0) {
    strengths.push(
      `${reg44CompletionRate}% Reg 44 report completion — strong compliance with independent visitor reporting requirements.`,
    );
  }

  if (reg45TimelinessRate >= 100 && totalReg45 > 0) {
    strengths.push(
      "All Regulation 45 quality-of-care reviews completed on time — the registered person demonstrates consistent compliance with the six-monthly review cycle.",
    );
  } else if (reg45TimelinessRate >= 80 && totalReg45 > 0) {
    strengths.push(
      `${reg45TimelinessRate}% Reg 45 review timeliness — strong compliance with quality-of-care review deadlines.`,
    );
  }

  if (actionPlanRate >= 90 && actionableActions > 0) {
    strengths.push(
      `${actionPlanRate}% of action plan items completed — the home demonstrates a strong commitment to addressing identified improvements and closing out actions.`,
    );
  } else if (actionPlanRate >= 70 && actionableActions > 0) {
    strengths.push(
      `${actionPlanRate}% action plan completion — the majority of identified actions are being addressed and closed.`,
    );
  }

  if (qualityImprovementRate >= 80 && totalQualityCycles > 0) {
    strengths.push(
      `${qualityImprovementRate}% of quality improvement cycles achieving their improvement goals — the home demonstrates effective use of structured improvement methodology.`,
    );
  } else if (qualityImprovementRate >= 60 && totalQualityCycles > 0) {
    strengths.push(
      `${qualityImprovementRate}% quality improvement achievement rate — the home is making measurable progress through its improvement cycles.`,
    );
  }

  if (notificationComplianceRate >= 95 && totalNotifications > 0) {
    strengths.push(
      `${notificationComplianceRate}% notification compliance — the home meets its Ofsted notification obligations comprehensively and promptly.`,
    );
  } else if (notificationComplianceRate >= 80 && totalNotifications > 0) {
    strengths.push(
      `${notificationComplianceRate}% notification compliance — strong adherence to Ofsted notification requirements.`,
    );
  }

  if (stakeholderEngagementRate >= 80 && totalReg45 > 0) {
    strengths.push(
      `${stakeholderEngagementRate}% stakeholder engagement in quality assurance — the home actively involves children, staff, placing authorities, parents, and professionals in its review processes.`,
    );
  } else if (stakeholderEngagementRate >= 60 && totalReg45 > 0) {
    strengths.push(
      `${stakeholderEngagementRate}% stakeholder engagement — good breadth of consultation in quality assurance processes.`,
    );
  }

  if (reg44QualityAvg >= 4.0 && submittedReg44 > 0) {
    strengths.push(
      `Reg 44 report quality averages ${reg44QualityAvg}/5 — independent visitor reports are thorough, well-structured, and provide meaningful oversight of the home's practice.`,
    );
  } else if (reg44QualityAvg >= 3.0 && submittedReg44 > 0) {
    strengths.push(
      `Reg 44 report quality averages ${reg44QualityAvg}/5 — independent visitor reports are competent and provide useful oversight.`,
    );
  }

  if (reg45QualityAvg >= 4.0 && totalReg45 > 0) {
    strengths.push(
      `Reg 45 review quality averages ${reg45QualityAvg}/5 — quality-of-care reviews are comprehensive, analytical, and drive meaningful improvement.`,
    );
  } else if (reg45QualityAvg >= 3.0 && totalReg45 > 0) {
    strengths.push(
      `Reg 45 review quality averages ${reg45QualityAvg}/5 — quality-of-care reviews provide a competent assessment of the home's standards.`,
    );
  }

  if (independenceRate >= 100 && totalReg44 > 0) {
    strengths.push(
      "All Reg 44 visits conducted by genuinely independent visitors — the home maintains the integrity and independence of its statutory oversight.",
    );
  }

  if (reg44ChildViewsRate >= 90 && totalReg44 > 0) {
    strengths.push(
      `Children's views captured in ${reg44ChildViewsRate}% of Reg 44 visits — the independent visitor consistently seeks and records children's perspectives.`,
    );
  }

  if (childrenSpokenToRate >= 90 && totalChildrenAvailable > 0) {
    strengths.push(
      `${childrenSpokenToRate}% of available children spoken to during Reg 44 visits — the independent visitor engages with the vast majority of children.`,
    );
  }

  if (shortfallActionRate >= 90 && totalShortfallsIdentified > 0) {
    strengths.push(
      `${shortfallActionRate}% of Reg 44 shortfalls actioned — the home responds promptly to independent visitor findings.`,
    );
  }

  if (prevActionResolutionRate >= 90 && totalPrevActionsTotal > 0) {
    strengths.push(
      `${prevActionResolutionRate}% of previous Reg 44 actions resolved — strong evidence of sustained follow-through on independent visitor recommendations.`,
    );
  }

  if (reg45CoverageRate >= 100 && totalReg45 > 0) {
    strengths.push(
      "All Reg 45 reviews cover the full range of quality standards — the registered person takes a comprehensive approach to quality-of-care assessment.",
    );
  }

  if (devPlanUpdateRate >= 100 && totalReg45 > 0) {
    strengths.push(
      "The development plan is updated following every Reg 45 review — demonstrating a clear link between quality review and strategic improvement planning.",
    );
  }

  if (reg44ConsideredInReg45Rate >= 100 && totalReg44Available > 0) {
    strengths.push(
      "All available Reg 44 reports are considered in Reg 45 reviews — the home effectively integrates independent visitor findings into its quality review cycle.",
    );
  }

  if (managerVerificationRate >= 90 && completedActions > 0) {
    strengths.push(
      `${managerVerificationRate}% of completed actions verified by management — robust management oversight of action plan delivery.`,
    );
  }

  if (evidenceRate >= 90 && completedActions > 0) {
    strengths.push(
      `${evidenceRate}% of completed actions supported by evidence — the home can demonstrate that improvements are real and not merely claimed.`,
    );
  }

  if (sustainedImprovementRate >= 80 && improvementAchieved > 0) {
    strengths.push(
      `${sustainedImprovementRate}% of achieved improvements sustained over time — the home embeds changes effectively rather than allowing standards to slip.`,
    );
  }

  if (recordsCheckRate >= 90 && totalReg44 > 0) {
    strengths.push(
      `${recordsCheckRate}% records-checking compliance across Reg 44 visits — the independent visitor consistently reviews medication, sanctions, complaints, and safeguarding records.`,
    );
  }

  if (reg45ChildConsultationRate >= 90 && totalChildrenTotalReg45 > 0) {
    strengths.push(
      `${reg45ChildConsultationRate}% of children consulted during Reg 45 reviews — children's voices are central to the quality-of-care review process.`,
    );
  }

  if (investigationCompletionRate >= 100 && totalNotifications > 0) {
    strengths.push(
      "All notifiable event investigations completed — the home ensures every significant event is fully investigated.",
    );
  }

  if (childInformedRate >= 90 && totalNotifications > 0) {
    strengths.push(
      `${childInformedRate}% of children informed of notification outcomes — children are kept informed about events affecting them.`,
    );
  }

  if (cycleChildConsultationRate >= 80 && totalQualityCycles > 0) {
    strengths.push(
      `Children consulted in ${cycleChildConsultationRate}% of quality improvement cycles — children's views shape the home's improvement priorities.`,
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CONCERNS
  // ══════════════════════════════════════════════════════════════════════════

  const concerns: string[] = [];

  if (reg44CompletionRate < 50 && totalReg44 > 0) {
    concerns.push(
      `Only ${reg44CompletionRate}% of Reg 44 reports submitted — the majority of monthly independent visitor reports are incomplete, representing a serious breach of the home's statutory obligations under Regulation 44.`,
    );
  } else if (reg44CompletionRate < 80 && reg44CompletionRate >= 50 && totalReg44 > 0) {
    concerns.push(
      `Reg 44 report completion at ${reg44CompletionRate}% — some independent visitor reports are not being submitted, which reduces the quality assurance oversight available to the home.`,
    );
  }

  if (totalReg44 === 0 && total_children > 0) {
    concerns.push(
      "No Regulation 44 independent visitor reports exist — the home has no evidence of monthly independent visits, which is a fundamental requirement of the Children's Homes Regulations 2015.",
    );
  }

  if (reg45TimelinessRate < 50 && totalReg45 > 0) {
    concerns.push(
      `Only ${reg45TimelinessRate}% of Reg 45 reviews completed on time — the majority of quality-of-care reviews are late, undermining the home's ability to systematically assess and improve care quality.`,
    );
  } else if (reg45TimelinessRate < 80 && reg45TimelinessRate >= 50 && totalReg45 > 0) {
    concerns.push(
      `Reg 45 review timeliness at ${reg45TimelinessRate}% — some quality-of-care reviews are not completed within the required timescales.`,
    );
  }

  if (totalReg45 === 0 && total_children > 0) {
    concerns.push(
      "No Regulation 45 quality-of-care reviews exist — the registered person has not conducted the required six-monthly review of care quality, which is a statutory obligation.",
    );
  }

  if (actionPlanRate < 40 && actionableActions > 0) {
    concerns.push(
      `Only ${actionPlanRate}% of action plan items completed — the majority of identified improvements remain unaddressed, indicating a systemic failure to translate quality assurance findings into practice improvement.`,
    );
  } else if (actionPlanRate < 70 && actionPlanRate >= 40 && actionableActions > 0) {
    concerns.push(
      `Action plan completion at ${actionPlanRate}% — a significant proportion of identified actions remain outstanding, slowing the pace of improvement.`,
    );
  }

  if (overdueActions > 0 && totalActionPlans > 0) {
    concerns.push(
      `${overdueActions} action plan item${overdueActions !== 1 ? "s are" : " is"} overdue — overdue actions represent stalled improvement efforts and may indicate insufficient management oversight or resource allocation.`,
    );
  }

  if (escalatedActions > 0 && totalActionPlans > 0) {
    concerns.push(
      `${escalatedActions} action${escalatedActions !== 1 ? "s have" : " has"} been escalated — escalation indicates actions that could not be resolved at the initial level and require senior management attention.`,
    );
  }

  if (criticalOverdue > 0 && criticalActions > 0) {
    concerns.push(
      `${criticalOverdue} critical-priority action${criticalOverdue !== 1 ? "s are" : " is"} overdue — critical actions directly affect children's safety and wellbeing and must be addressed as the highest priority.`,
    );
  }

  if (qualityImprovementRate < 40 && totalQualityCycles > 0) {
    concerns.push(
      `Only ${qualityImprovementRate}% of quality improvement cycles achieving their goals — the home's improvement methodology is not translating into measurable change.`,
    );
  } else if (qualityImprovementRate < 60 && qualityImprovementRate >= 40 && totalQualityCycles > 0) {
    concerns.push(
      `Quality improvement achievement at ${qualityImprovementRate}% — improvement cycles are producing inconsistent results.`,
    );
  }

  if (abandonedCycles > 0 && totalQualityCycles > 0) {
    concerns.push(
      `${abandonedCycles} quality improvement cycle${abandonedCycles !== 1 ? "s" : ""} abandoned — abandoned cycles represent wasted effort and may indicate a lack of commitment to sustained improvement.`,
    );
  }

  if (notificationComplianceRate < 50 && totalNotifications > 0) {
    concerns.push(
      `Notification compliance at only ${notificationComplianceRate}% — the home is failing to meet its statutory obligations to notify Ofsted and relevant authorities of significant events within required timescales.`,
    );
  } else if (notificationComplianceRate < 80 && notificationComplianceRate >= 50 && totalNotifications > 0) {
    concerns.push(
      `Notification compliance at ${notificationComplianceRate}% — some notifications are not being made in full or on time, which may result in regulatory action.`,
    );
  }

  if (notificationTimelinessRate < 80 && totalNotifications > 0) {
    concerns.push(
      `Only ${notificationTimelinessRate}% of notifications made within 24 hours — delays in notification prevent timely external oversight and support.`,
    );
  }

  if (stakeholderEngagementRate < 40 && totalReg45 > 0) {
    concerns.push(
      `Stakeholder engagement at only ${stakeholderEngagementRate}% — the home is not adequately consulting children, staff, placing authorities, parents, or professionals in its quality assurance processes.`,
    );
  } else if (stakeholderEngagementRate < 60 && stakeholderEngagementRate >= 40 && totalReg45 > 0) {
    concerns.push(
      `Stakeholder engagement at ${stakeholderEngagementRate}% — limited consultation breadth undermines the comprehensiveness of quality assurance reviews.`,
    );
  }

  if (independenceRate < 80 && totalReg44 > 0) {
    concerns.push(
      `Only ${independenceRate}% of Reg 44 visits conducted by independent visitors — the independence requirement is not being consistently met, which undermines the integrity of the oversight process.`,
    );
  }

  if (reg44ChildViewsRate < 70 && totalReg44 > 0) {
    concerns.push(
      `Children's views captured in only ${reg44ChildViewsRate}% of Reg 44 visits — the independent visitor is not consistently seeking children's perspectives.`,
    );
  }

  if (shortfallActionRate < 60 && totalShortfallsIdentified > 0) {
    concerns.push(
      `Only ${shortfallActionRate}% of Reg 44 shortfalls have been actioned — the home is not adequately responding to independent visitor findings, reducing the value of the oversight process.`,
    );
  }

  if (reg45CoverageRate < 80 && totalReg45 > 0) {
    concerns.push(
      `Only ${reg45CoverageRate}% of Reg 45 reviews cover all quality standards — incomplete reviews cannot provide a comprehensive picture of the home's care quality.`,
    );
  }

  if (reg44ConsideredInReg45Rate < 80 && totalReg44Available > 0) {
    concerns.push(
      `Only ${reg44ConsideredInReg45Rate}% of Reg 44 reports considered in Reg 45 reviews — the home is not fully integrating independent visitor findings into its quality review cycle, missing a critical quality assurance link.`,
    );
  }

  if (reg45ChildConsultationRate < 70 && totalChildrenTotalReg45 > 0) {
    concerns.push(
      `Only ${reg45ChildConsultationRate}% of children consulted during Reg 45 reviews — quality-of-care reviews are not sufficiently informed by children's own experiences.`,
    );
  }

  if (managerVerificationRate < 60 && completedActions > 0) {
    concerns.push(
      `Only ${managerVerificationRate}% of completed actions verified by management — without management sign-off, the home cannot be confident that actions have been genuinely completed and are effective.`,
    );
  }

  if (evidenceRate < 60 && completedActions > 0) {
    concerns.push(
      `Only ${evidenceRate}% of completed actions supported by evidence — without documented evidence, the home cannot demonstrate to Ofsted that improvements are real.`,
    );
  }

  if (followUpRate < 70 && followUpRequired > 0) {
    concerns.push(
      `Only ${followUpRate}% of required follow-ups completed — incomplete follow-up undermines the effectiveness of the quality assurance cycle.`,
    );
  }

  if (investigationCompletionRate < 80 && totalNotifications > 0) {
    concerns.push(
      `Only ${investigationCompletionRate}% of notifiable event investigations completed — incomplete investigations leave the home without a full understanding of events and required changes.`,
    );
  }

  if (recordsCheckRate < 70 && totalReg44 > 0) {
    concerns.push(
      `Records-checking compliance at only ${recordsCheckRate}% across Reg 44 visits — the independent visitor is not consistently reviewing medication, sanctions, complaints, and safeguarding records.`,
    );
  }

  if (sustainedImprovementRate < 50 && improvementAchieved > 0) {
    concerns.push(
      `Only ${sustainedImprovementRate}% of achieved improvements sustained over time — improvements are not being embedded, suggesting a lack of sustained management focus.`,
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RECOMMENDATIONS
  // ══════════════════════════════════════════════════════════════════════════

  const recommendations: Reg4445QualityRecommendation[] = [];
  let rank = 0;

  if (totalReg44 === 0 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Appoint an independent visitor and commence monthly Regulation 44 visits immediately — the absence of any Reg 44 reports is a fundamental breach of the Children's Homes Regulations 2015 that will be treated as a serious regulatory failure by Ofsted.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 44 — Independent person: visits and reports",
    });
  }

  if (totalReg45 === 0 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Conduct a Regulation 45 quality-of-care review immediately and establish a minimum six-monthly review cycle — the registered person has a statutory duty to review the quality of care at least every six months.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 45 — Review of quality of care",
    });
  }

  if (reg44CompletionRate < 50 && totalReg44 > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently address the low Reg 44 report submission rate — the independent visitor must submit reports within the statutory timeframe following every monthly visit. Implement a tracking system with escalation to the responsible individual if reports are not received.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 44 — Independent person: visits and reports",
    });
  }

  if (reg45TimelinessRate < 50 && totalReg45 > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently improve Reg 45 review timeliness — late quality-of-care reviews mean the home operates without systematic quality oversight for extended periods. Implement calendar-based scheduling with advance preparation.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 45 — Review of quality of care",
    });
  }

  if (notificationComplianceRate < 50 && totalNotifications > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently implement a notification compliance protocol — failure to notify Ofsted and relevant authorities of significant events is a serious regulatory breach. Establish clear staff guidance on notification triggers and timescales.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 40 — Notification of serious events",
    });
  }

  if (actionPlanRate < 40 && actionableActions > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Address the critically low action plan completion rate — the accumulation of unresolved actions indicates a systemic failure to drive improvement. Implement weekly management tracking of action plan progress with escalation for overdue items.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Leadership and management",
    });
  }

  if (criticalOverdue > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Resolve all critical-priority overdue actions immediately — critical actions directly impact children's safety and wellbeing and cannot remain outstanding. Assign senior management ownership and daily oversight until resolved.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Leadership and management",
    });
  }

  if (independenceRate < 80 && totalReg44 > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all Reg 44 visits are conducted by genuinely independent visitors — the independence requirement is a safeguard for children and the integrity of the oversight process. Review the appointment of the current visitor if independence concerns exist.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 44 — Independent person: visits and reports",
    });
  }

  if (notificationTimelinessRate < 80 && totalNotifications > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve notification timeliness to meet the 24-hour requirement — implement a clear notification pathway with designated responsibility and out-of-hours procedures to ensure no notification is delayed.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 40 — Notification of serious events",
    });
  }

  if (reg44CompletionRate >= 50 && reg44CompletionRate < 80 && totalReg44 > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve Reg 44 report submission rate toward 100% — every monthly visit must result in a submitted report. Review barriers to timely submission and address with the independent visitor.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 44 — Independent person: visits and reports",
    });
  }

  if (reg45TimelinessRate >= 50 && reg45TimelinessRate < 80 && totalReg45 > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve Reg 45 review timeliness — schedule reviews well in advance and begin preparation early to ensure they are completed within the required six-monthly cycle.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 45 — Review of quality of care",
    });
  }

  if (actionPlanRate >= 40 && actionPlanRate < 70 && actionableActions > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase action plan completion rate — establish regular management review of open actions, allocate resources to clear backlogs, and ensure every action has a named owner and realistic target date.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Leadership and management",
    });
  }

  if (qualityImprovementRate < 60 && totalQualityCycles > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review the effectiveness of quality improvement methodology — when improvement cycles are not achieving their goals, the approach may need strengthening. Consider training in Plan-Do-Study-Act or similar structured improvement methods.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Leadership and management",
    });
  }

  if (shortfallActionRate < 60 && totalShortfallsIdentified > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve the response rate to Reg 44 shortfalls — identified shortfalls that are not addressed undermine the purpose of independent oversight. Track shortfall actions alongside the main action plan.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 44 — Independent person: visits and reports",
    });
  }

  if (reg45CoverageRate < 80 && totalReg45 > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all Reg 45 reviews cover the full range of quality standards — use a structured review framework aligned to the Children's Homes Regulations to prevent gaps in coverage.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 45 — Review of quality of care",
    });
  }

  if (reg44ConsideredInReg45Rate < 80 && totalReg44Available > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all available Reg 44 reports are systematically reviewed within Reg 45 quality-of-care reviews — the integration of independent visitor findings is essential for a comprehensive quality assessment.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 45 — Review of quality of care",
    });
  }

  if (reg44ChildViewsRate < 70 && totalReg44 > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure the independent visitor consistently captures children's views during Reg 44 visits — children's perspectives are essential to meaningful oversight and must be systematically sought.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 44 — Independent person: visits and reports",
    });
  }

  if (stakeholderEngagementRate < 60 && totalReg45 > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Broaden stakeholder engagement in quality assurance processes — actively seek contributions from children, staff, placing authorities, parents/carers, and professionals to ensure reviews reflect the full range of perspectives.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 45 — Review of quality of care",
    });
  }

  if (managerVerificationRate < 60 && completedActions > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement management verification of all completed action plan items — without manager sign-off, the home cannot be confident that actions are genuinely completed and effective.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Leadership and management",
    });
  }

  if (evidenceRate < 60 && completedActions > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Require evidence of completion for all action plan items — documented evidence is essential to demonstrate to Ofsted that improvements are real and measurable.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Leadership and management",
    });
  }

  if (devPlanUpdateRate < 80 && totalReg45 > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure the development plan is updated following every Reg 45 review — the development plan must reflect current improvement priorities identified through the quality review cycle.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 45 — Review of quality of care",
    });
  }

  if (reg45ChildConsultationRate < 70 && totalChildrenTotalReg45 > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase the proportion of children consulted during Reg 45 reviews — every child should have the opportunity to contribute their views on the quality of care they receive.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 45 — Review of quality of care",
    });
  }

  if (cycleChildConsultationRate < 60 && totalQualityCycles > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Involve children in quality improvement cycles — children's views should inform which areas are prioritised for improvement and how changes are evaluated.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (sustainedImprovementRate < 50 && improvementAchieved > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Focus on sustaining achieved improvements — implement ongoing monitoring mechanisms and periodic re-measurement to ensure gains are maintained over time rather than reverting to previous standards.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Leadership and management",
    });
  }

  if (recordsCheckRate < 70 && totalReg44 > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure the independent visitor consistently reviews medication records, sanctions records, complaints, and safeguarding documentation during each Reg 44 visit — systematic records review is a key component of effective oversight.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 44 — Independent person: visits and reports",
    });
  }

  if (followUpRate < 70 && followUpRequired > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Complete all outstanding follow-up actions — follow-up is essential to closing the quality assurance loop and demonstrating that identified issues are fully resolved.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Leadership and management",
    });
  }

  if (investigationCompletionRate < 80 && totalNotifications > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Complete all outstanding notifiable event investigations — incomplete investigations leave the home without a full understanding of events and the changes needed to prevent recurrence.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 40 — Notification of serious events",
    });
  }

  if (childInformedRate < 80 && totalNotifications > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure children are informed of the outcomes of notifiable events that affect them — children have a right to understand what happened and what the home is doing to keep them safe.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // INSIGHTS
  // ══════════════════════════════════════════════════════════════════════════

  const insights: Reg4445QualityInsight[] = [];

  // -- Critical insights --

  if (totalReg44 === 0 && total_children > 0) {
    insights.push({
      text: "The home has no Regulation 44 independent visitor reports. This is a fundamental regulatory breach — CHR 2015 Reg 44 requires an independent person to visit the home at least monthly, interview children and staff, inspect records, and produce a written report. The absence of any Reg 44 activity means there is no independent oversight of the home's care of children.",
      severity: "critical",
    });
  }

  if (totalReg45 === 0 && total_children > 0) {
    insights.push({
      text: "The home has no Regulation 45 quality-of-care reviews. This is a statutory breach — the registered person must review the quality of care at least every six months, considering the standards in the Regulations. Without this review, the home has no systematic process for assessing and improving its own care quality.",
      severity: "critical",
    });
  }

  if (reg44CompletionRate < 50 && totalReg44 > 0) {
    insights.push({
      text: `Only ${reg44CompletionRate}% of Reg 44 reports submitted. The independent visitor reporting function is fundamentally compromised — without complete reports, the home lacks the external quality assurance oversight that Ofsted relies upon to assess leadership and management effectiveness.`,
      severity: "critical",
    });
  }

  if (reg45TimelinessRate < 50 && totalReg45 > 0) {
    insights.push({
      text: `Only ${reg45TimelinessRate}% of Reg 45 reviews completed on time. The quality-of-care review cycle is not functioning as intended — late reviews mean the home operates for extended periods without systematic quality assessment, allowing problems to accumulate undetected.`,
      severity: "critical",
    });
  }

  if (notificationComplianceRate < 50 && totalNotifications > 0) {
    insights.push({
      text: `Notification compliance at only ${notificationComplianceRate}%. The home is failing to meet its legal obligations to notify Ofsted and relevant authorities of serious events. This prevents timely external oversight and may constitute a regulatory offence.`,
      severity: "critical",
    });
  }

  if (actionPlanRate < 40 && actionableActions > 0) {
    insights.push({
      text: `Only ${actionPlanRate}% of action plan items completed. The accumulation of unresolved actions indicates that the quality assurance cycle is not driving improvement — findings from Reg 44 visits, Reg 45 reviews, and other sources are being identified but not acted upon, creating an ever-growing improvement deficit.`,
      severity: "critical",
    });
  }

  if (criticalOverdue > 0) {
    insights.push({
      text: `${criticalOverdue} critical-priority action${criticalOverdue !== 1 ? "s" : ""} overdue. Critical actions are those assessed as directly impacting children's safety and wellbeing. Their continued non-resolution represents an unacceptable risk to children in the home's care.`,
      severity: "critical",
    });
  }

  if (independenceRate < 50 && totalReg44 > 0) {
    insights.push({
      text: `Only ${independenceRate}% of Reg 44 visits conducted by genuinely independent visitors. The independence of the visitor is a fundamental safeguard — if the visitor is not independent, the entire purpose of Reg 44 oversight is compromised. Ofsted will regard this as a serious concern.`,
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (reg44CompletionRate >= 50 && reg44CompletionRate < 80 && totalReg44 > 0) {
    insights.push({
      text: `Reg 44 report completion at ${reg44CompletionRate}% — improving but some reports remain outstanding. Each missing report represents a gap in the home's independent oversight record that Ofsted will query.`,
      severity: "warning",
    });
  }

  if (reg45TimelinessRate >= 50 && reg45TimelinessRate < 80 && totalReg45 > 0) {
    insights.push({
      text: `Reg 45 review timeliness at ${reg45TimelinessRate}% — some reviews are delayed beyond the required timescale. Late reviews compress the period between assessments and may miss emerging issues.`,
      severity: "warning",
    });
  }

  if (actionPlanRate >= 40 && actionPlanRate < 70 && actionableActions > 0) {
    insights.push({
      text: `Action plan completion at ${actionPlanRate}% — a significant number of actions remain open. The pace of improvement is slower than the rate at which new findings are identified, which may lead to an accumulating backlog.`,
      severity: "warning",
    });
  }

  if (overdueActions > 0 && actionPlanRate >= 40 && totalActionPlans > 0) {
    insights.push({
      text: `${overdueActions} action${overdueActions !== 1 ? "s" : ""} overdue in the action plan. While the overall completion rate is not critically low, overdue items indicate specific areas where improvement has stalled and management attention is needed.`,
      severity: "warning",
    });
  }

  if (qualityImprovementRate >= 40 && qualityImprovementRate < 60 && totalQualityCycles > 0) {
    insights.push({
      text: `Quality improvement achievement at ${qualityImprovementRate}% — improvement cycles are producing inconsistent results. Consider whether goals are realistic, methods are appropriate, and sufficient time is allowed for change to take effect.`,
      severity: "warning",
    });
  }

  if (notificationComplianceRate >= 50 && notificationComplianceRate < 80 && totalNotifications > 0) {
    insights.push({
      text: `Notification compliance at ${notificationComplianceRate}% — while not critically low, any gap in notification compliance is taken seriously by Ofsted. Each missed or late notification potentially delays external support and oversight.`,
      severity: "warning",
    });
  }

  if (stakeholderEngagementRate >= 40 && stakeholderEngagementRate < 60 && totalReg45 > 0) {
    insights.push({
      text: `Stakeholder engagement at ${stakeholderEngagementRate}% — quality assurance processes are not drawing on the full range of perspectives available. Broader consultation strengthens the validity and impact of quality reviews.`,
      severity: "warning",
    });
  }

  if (reg44QualityAvg < 3.0 && reg44QualityAvg > 0 && submittedReg44 > 0) {
    insights.push({
      text: `Reg 44 report quality averaging ${reg44QualityAvg}/5 — reports may lack depth, fail to adequately capture children's views, or not cover the full range of required areas. Consider whether the current independent visitor has the skills and knowledge needed for effective oversight.`,
      severity: "warning",
    });
  }

  if (reg45QualityAvg < 3.0 && reg45QualityAvg > 0 && totalReg45 > 0) {
    insights.push({
      text: `Reg 45 review quality averaging ${reg45QualityAvg}/5 — reviews may be superficial or formulaic rather than genuinely analytical. Effective Reg 45 reviews should critically evaluate all aspects of care quality, not merely confirm compliance.`,
      severity: "warning",
    });
  }

  if (independenceRate >= 50 && independenceRate < 80 && totalReg44 > 0) {
    insights.push({
      text: `Independence rate at ${independenceRate}% across Reg 44 visits — some visits may have been conducted by individuals without genuine independence from the home. The credibility of oversight depends entirely on the visitor's independence.`,
      severity: "warning",
    });
  }

  if (shortfallActionRate >= 60 && shortfallActionRate < 80 && totalShortfallsIdentified > 0) {
    insights.push({
      text: `${shortfallActionRate}% of Reg 44 shortfalls actioned — while most findings are being addressed, unresolved shortfalls represent known issues that the home has not yet corrected. Track each shortfall to resolution.`,
      severity: "warning",
    });
  }

  if (prevActionResolutionRate >= 50 && prevActionResolutionRate < 80 && totalPrevActionsTotal > 0) {
    insights.push({
      text: `Previous Reg 44 action resolution at ${prevActionResolutionRate}% — some actions from earlier visits remain unresolved. Recurring unresolved actions create a pattern that Ofsted will view as indicative of poor follow-through.`,
      severity: "warning",
    });
  }

  if (devPlanUpdateRate < 80 && devPlanUpdateRate > 0 && totalReg45 > 0) {
    insights.push({
      text: `Development plan updated after only ${devPlanUpdateRate}% of Reg 45 reviews — the development plan should be a living document that reflects current improvement priorities. Without updates, it becomes disconnected from the home's actual quality position.`,
      severity: "warning",
    });
  }

  if (abandonedCycles > 0 && totalQualityCycles >= 3) {
    insights.push({
      text: `${abandonedCycles} of ${totalQualityCycles} quality improvement cycles abandoned. A pattern of abandoned cycles may indicate overambitious goals, insufficient resources, or a lack of management commitment to see improvements through.`,
      severity: "warning",
    });
  }

  if (sustainedImprovementRate >= 30 && sustainedImprovementRate < 50 && improvementAchieved > 0) {
    insights.push({
      text: `Only ${sustainedImprovementRate}% of achieved improvements sustained over time. Initial gains are being lost, suggesting that improvements are not being embedded through updated policies, training, or ongoing monitoring.`,
      severity: "warning",
    });
  }

  // Action plan source analysis
  const topSources = Object.entries(actionsBySource)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topSources.length > 0 && totalActionPlans >= 5) {
    const sourceStr = topSources
      .map(([s, c]) => `${s.replace(/_/g, " ")} (${c})`)
      .join(", ");
    insights.push({
      text: `Action plan sources: ${sourceStr}. Understanding where most actions originate helps focus quality assurance efforts — if one source consistently generates the most findings, it may indicate a systemic issue in that area.`,
      severity: "warning",
    });
  }

  // Notification type analysis
  const notificationTypeCounts: Record<string, number> = {};
  for (const n of notification_records) {
    notificationTypeCounts[n.notification_type] =
      (notificationTypeCounts[n.notification_type] ?? 0) + 1;
  }
  const topNotificationTypes = Object.entries(notificationTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topNotificationTypes.length > 0 && totalNotifications >= 3) {
    const ntStr = topNotificationTypes
      .map(([t, c]) => `${t.replace(/_/g, " ")} (${c})`)
      .join(", ");
    insights.push({
      text: `Notification event types: ${ntStr}. Patterns in notification types may reveal areas requiring targeted intervention or additional staff training to prevent recurrence.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (quality_assurance_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding quality assurance and regulatory compliance — Reg 44 and Reg 45 processes are comprehensive and timely, action plans are completed effectively, quality improvement cycles achieve sustained results, and notification obligations are met in full. This is strong evidence of effective leadership and management under the SCCIF framework.",
      severity: "positive",
    });
  }

  if (
    reg44CompletionRate >= 100 &&
    reg44QualityAvg >= 4.0 &&
    totalReg44 > 0
  ) {
    insights.push({
      text: `100% Reg 44 report submission with quality averaging ${reg44QualityAvg}/5 — the independent visitor function is operating at an exceptional level, providing comprehensive, high-quality oversight that strengthens the home's quality assurance framework.`,
      severity: "positive",
    });
  }

  if (
    reg45TimelinessRate >= 100 &&
    reg45CoverageRate >= 100 &&
    totalReg45 > 0
  ) {
    insights.push({
      text: "All Reg 45 reviews completed on time with full standards coverage — the registered person demonstrates exemplary compliance with the quality-of-care review duty, ensuring no aspect of care quality is overlooked.",
      severity: "positive",
    });
  }

  if (
    actionPlanRate >= 90 &&
    managerVerificationRate >= 90 &&
    evidenceRate >= 90 &&
    actionableActions > 0
  ) {
    insights.push({
      text: `${actionPlanRate}% action plan completion with ${managerVerificationRate}% management verification and ${evidenceRate}% evidence of completion — the home operates a rigorous action plan cycle that translates findings into verified, evidenced improvements.`,
      severity: "positive",
    });
  }

  if (
    qualityImprovementRate >= 80 &&
    sustainedImprovementRate >= 80 &&
    totalQualityCycles > 0
  ) {
    insights.push({
      text: `${qualityImprovementRate}% of improvement cycles achieving goals with ${sustainedImprovementRate}% sustained over time — the home demonstrates a mature and effective quality improvement culture where changes are embedded and maintained.`,
      severity: "positive",
    });
  }

  if (
    notificationComplianceRate >= 95 &&
    investigationCompletionRate >= 100 &&
    totalNotifications > 0
  ) {
    insights.push({
      text: `${notificationComplianceRate}% notification compliance with all investigations completed — the home responds to serious events with both regulatory compliance and thorough investigation, demonstrating responsible and accountable practice.`,
      severity: "positive",
    });
  }

  if (
    stakeholderEngagementRate >= 80 &&
    reg45ChildConsultationRate >= 90 &&
    totalReg45 > 0
  ) {
    insights.push({
      text: `${stakeholderEngagementRate}% stakeholder engagement with ${reg45ChildConsultationRate}% of children consulted — quality assurance reviews draw on a rich range of perspectives, ensuring that assessments of care quality reflect the experiences of all stakeholders.`,
      severity: "positive",
    });
  }

  if (
    reg44ConsideredInReg45Rate >= 100 &&
    devPlanUpdateRate >= 100 &&
    totalReg44Available > 0 &&
    totalReg45 > 0
  ) {
    insights.push({
      text: "Complete integration of Reg 44 findings into Reg 45 reviews with development plan always updated — the home demonstrates an exemplary quality assurance chain linking independent oversight to strategic improvement planning.",
      severity: "positive",
    });
  }

  if (
    shortfallActionRate >= 90 &&
    prevActionResolutionRate >= 90 &&
    totalShortfallsIdentified > 0 &&
    totalPrevActionsTotal > 0
  ) {
    insights.push({
      text: `${shortfallActionRate}% of shortfalls actioned and ${prevActionResolutionRate}% of previous actions resolved — the home demonstrates sustained follow-through on independent visitor findings, closing the loop between identification and resolution.`,
      severity: "positive",
    });
  }

  if (
    independenceRate >= 100 &&
    reg44ChildViewsRate >= 90 &&
    recordsCheckRate >= 90 &&
    totalReg44 > 0
  ) {
    insights.push({
      text: "All visits conducted by independent visitors, with children's views consistently captured and records systematically reviewed — the Reg 44 function operates to the highest standard, providing robust external oversight of the home.",
      severity: "positive",
    });
  }

  if (
    cycleChildConsultationRate >= 80 &&
    evidenceCollectionRate >= 90 &&
    outcomeMeasurementRate >= 90 &&
    totalQualityCycles > 0
  ) {
    insights.push({
      text: `Children consulted in ${cycleChildConsultationRate}% of improvement cycles with ${evidenceCollectionRate}% evidence collection and ${outcomeMeasurementRate}% outcome measurement — the home's improvement methodology is rigorous, child-centred, and evidence-based.`,
      severity: "positive",
    });
  }

  if (
    childInformedRate >= 90 &&
    notificationActionRate >= 90 &&
    totalNotifications > 0
  ) {
    insights.push({
      text: `${childInformedRate}% of children informed of outcomes and ${notificationActionRate}% of actions from notifications completed — the home ensures that children are kept informed and that every serious event leads to completed learning actions.`,
      severity: "positive",
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // HEADLINE
  // ══════════════════════════════════════════════════════════════════════════

  let headline: string;

  if (quality_assurance_rating === "outstanding") {
    headline =
      "Outstanding Reg 44/45 quality assurance — independent visitor reports are comprehensive and timely, quality-of-care reviews drive sustained improvement, and notification compliance is exemplary.";
  } else if (quality_assurance_rating === "good") {
    headline = `Good Reg 44/45 quality assurance — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (quality_assurance_rating === "adequate") {
    headline = `Adequate Reg 44/45 quality assurance — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure effective quality oversight.`;
  } else {
    headline = `Reg 44/45 quality assurance is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to meet statutory quality assurance obligations.`;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RETURN
  // ══════════════════════════════════════════════════════════════════════════

  return {
    quality_assurance_rating,
    quality_assurance_score: score,
    headline,
    total_reg44_reports: totalReg44,
    total_reg45_reviews: totalReg45,
    total_action_plans: totalActionPlans,
    total_quality_cycles: totalQualityCycles,
    total_notifications: totalNotifications,
    reg44_completion_rate: reg44CompletionRate,
    reg45_timeliness_rate: reg45TimelinessRate,
    action_plan_rate: actionPlanRate,
    quality_improvement_rate: qualityImprovementRate,
    notification_compliance_rate: notificationComplianceRate,
    stakeholder_engagement_rate: stakeholderEngagementRate,
    reg44_quality_avg: reg44QualityAvg,
    reg45_quality_avg: reg45QualityAvg,
    action_plan_overdue_count: overdueActions,
    action_plan_escalated_count: escalatedActions,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
