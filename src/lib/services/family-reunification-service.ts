// ==============================================================================
// CARA -- FAMILY REUNIFICATION & RETURN HOME PLANNING SERVICE
// Tracks family reunification planning: initial and viability assessments, family
// and home environment checks, phased contact and overnight/extended stay trials,
// reunification decisions, transition plans, post-reunification support, breakdown
// monitoring, and case closure for looked-after children returning to family care.
//
// Covers: Planning stage and status tracking, family member and relationship mapping,
// risk assessment and safeguarding clearance, child views and wishes, family support
// services, parenting assessments, home suitability checks, LA support plans, school
// and health service transitions, IRO and legal consultation, court order status,
// return date planning, post-return monitoring, success/failure tracking, and
// multi-agency coordination.
//
// UK Regulatory Framework:
// CHR 2015 Reg 7 (children's plans — rehabilitation to family),
// Children Act 1989 s23C,
// Care Planning Regulations 2010 Part 5 (ceasing to look after),
// SCCIF: Overall experiences — "When safe, children return to their families with
// appropriate support."
// DfE reunification practice framework.
// ==============================================================================

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// -- Enums (const arrays + types) ---------------------------------------------

export const PLANNING_STAGES = [
  "Initial Assessment",
  "Viability Assessment",
  "Family Assessment",
  "Home Environment Check",
  "Phased Contact Plan",
  "Overnight Stay Trial",
  "Extended Stay Trial",
  "Reunification Decision",
  "Transition Plan",
  "Post-Reunification Support",
  "Breakdown — Return to Care",
  "Review/Monitoring",
  "Case Closure",
] as const;
export type PlanningStage = (typeof PLANNING_STAGES)[number];

export const RELATIONSHIPS = [
  "Mother",
  "Father",
  "Both Parents",
  "Grandparent",
  "Other Family Member",
  "Connected Person",
] as const;
export type Relationship = (typeof RELATIONSHIPS)[number];

export const STATUSES = [
  "Active Planning",
  "On Hold",
  "Reunification Successful",
  "Reunification Failed",
  "Not Recommended",
  "Case Closed",
] as const;
export type ReunificationStatus = (typeof STATUSES)[number];

// -- Derived enum subsets for domain logic ------------------------------------

export const ASSESSMENT_STAGES: PlanningStage[] = [
  "Initial Assessment",
  "Viability Assessment",
  "Family Assessment",
  "Home Environment Check",
];

export const TRIAL_STAGES: PlanningStage[] = [
  "Phased Contact Plan",
  "Overnight Stay Trial",
  "Extended Stay Trial",
];

export const DECISION_STAGES: PlanningStage[] = [
  "Reunification Decision",
  "Transition Plan",
];

export const POST_RETURN_STAGES: PlanningStage[] = [
  "Post-Reunification Support",
  "Breakdown — Return to Care",
  "Review/Monitoring",
  "Case Closure",
];

export const ACTIVE_STATUSES: ReunificationStatus[] = [
  "Active Planning",
  "On Hold",
];

export const CONCLUDED_STATUSES: ReunificationStatus[] = [
  "Reunification Successful",
  "Reunification Failed",
  "Not Recommended",
  "Case Closed",
];

export const PARENT_RELATIONSHIPS: Relationship[] = [
  "Mother",
  "Father",
  "Both Parents",
];

export const EXTENDED_FAMILY_RELATIONSHIPS: Relationship[] = [
  "Grandparent",
  "Other Family Member",
  "Connected Person",
];

// -- Label maps ---------------------------------------------------------------

export const PLANNING_STAGE_LABELS: { stage: PlanningStage; label: string }[] = [
  { stage: "Initial Assessment", label: "Initial Assessment" },
  { stage: "Viability Assessment", label: "Viability Assessment" },
  { stage: "Family Assessment", label: "Family Assessment" },
  { stage: "Home Environment Check", label: "Home Environment Check" },
  { stage: "Phased Contact Plan", label: "Phased Contact Plan" },
  { stage: "Overnight Stay Trial", label: "Overnight Stay Trial" },
  { stage: "Extended Stay Trial", label: "Extended Stay Trial" },
  { stage: "Reunification Decision", label: "Reunification Decision" },
  { stage: "Transition Plan", label: "Transition Plan" },
  { stage: "Post-Reunification Support", label: "Post-Reunification Support" },
  { stage: "Breakdown — Return to Care", label: "Breakdown — Return to Care" },
  { stage: "Review/Monitoring", label: "Review/Monitoring" },
  { stage: "Case Closure", label: "Case Closure" },
];

export const RELATIONSHIP_LABELS: { relationship: Relationship; label: string }[] = [
  { relationship: "Mother", label: "Mother" },
  { relationship: "Father", label: "Father" },
  { relationship: "Both Parents", label: "Both Parents" },
  { relationship: "Grandparent", label: "Grandparent" },
  { relationship: "Other Family Member", label: "Other Family Member" },
  { relationship: "Connected Person", label: "Connected Person" },
];

export const STATUS_LABELS: { status: ReunificationStatus; label: string }[] = [
  { status: "Active Planning", label: "Active Planning" },
  { status: "On Hold", label: "On Hold" },
  { status: "Reunification Successful", label: "Reunification Successful" },
  { status: "Reunification Failed", label: "Reunification Failed" },
  { status: "Not Recommended", label: "Not Recommended" },
  { status: "Case Closed", label: "Case Closed" },
];

// -- Row type -----------------------------------------------------------------

export interface FamilyReunificationRow {
  id: string;
  home_id: string;
  child_name: string;
  record_date: string;
  social_worker_name: string;
  planning_stage: PlanningStage;
  family_member: string;
  relationship: Relationship;
  risk_assessment_current: boolean;
  safeguarding_cleared: boolean;
  child_views_obtained: boolean;
  child_wishes_to_return: boolean | null;
  family_support_services: boolean;
  parenting_assessment_completed: boolean;
  home_suitable: boolean | null;
  local_authority_support_plan: boolean;
  school_transition_planned: boolean;
  health_services_transferred: boolean;
  independent_reviewing_officer_consulted: boolean;
  legal_advice_obtained: boolean;
  court_order_status: string | null;
  estimated_return_date: string | null;
  actual_return_date: string | null;
  post_return_monitoring_weeks: number | null;
  status: ReunificationStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// -- Validation ---------------------------------------------------------------

export function validateFamilyReunification(input: {
  childName?: string;
  recordDate?: string;
  socialWorkerName?: string;
  planningStage?: string;
  familyMember?: string;
  relationship?: string;
  status?: string;
  riskAssessmentCurrent?: boolean;
  safeguardingCleared?: boolean;
  childViewsObtained?: boolean;
  childWishesToReturn?: boolean | null;
  parentingAssessmentCompleted?: boolean;
  homeSuitable?: boolean | null;
  independentReviewingOfficerConsulted?: boolean;
  legalAdviceObtained?: boolean;
  estimatedReturnDate?: string | null;
  actualReturnDate?: string | null;
  postReturnMonitoringWeeks?: number | null;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.childName || input.childName.trim().length === 0) {
    errors.push("Child name is required");
  }

  if (!input.recordDate) {
    errors.push("Record date is required");
  } else {
    const dateObj = new Date(input.recordDate);
    if (isNaN(dateObj.getTime())) {
      errors.push("Record date must be a valid date");
    } else if (dateObj > new Date()) {
      errors.push("Record date cannot be in the future");
    }
  }

  if (!input.socialWorkerName || input.socialWorkerName.trim().length === 0) {
    errors.push("Social worker name is required");
  }

  if (!input.planningStage || !(PLANNING_STAGES as readonly string[]).includes(input.planningStage)) {
    errors.push(`Planning stage must be one of: ${PLANNING_STAGES.join(", ")}`);
  }

  if (!input.familyMember || input.familyMember.trim().length === 0) {
    errors.push("Family member name is required");
  }

  if (!input.relationship || !(RELATIONSHIPS as readonly string[]).includes(input.relationship)) {
    errors.push(`Relationship must be one of: ${RELATIONSHIPS.join(", ")}`);
  }

  if (input.status && !(STATUSES as readonly string[]).includes(input.status)) {
    errors.push(`Status must be one of: ${STATUSES.join(", ")}`);
  }

  // Business rule: Post-return monitoring weeks should be positive
  if (
    input.postReturnMonitoringWeeks !== undefined &&
    input.postReturnMonitoringWeeks !== null &&
    input.postReturnMonitoringWeeks < 0
  ) {
    errors.push("Post-return monitoring weeks must be a positive number");
  }

  // Business rule: Trial stages require risk assessment and safeguarding clearance
  if (
    input.planningStage &&
    (TRIAL_STAGES as string[]).includes(input.planningStage) &&
    input.riskAssessmentCurrent === false &&
    input.safeguardingCleared === false
  ) {
    errors.push(
      `${input.planningStage} cannot proceed without a current risk assessment or safeguarding clearance — Care Planning Regulations 2010 Part 5 requires that the child's safety is assured before any trial period begins. CHR 2015 Reg 7 requires that the care plan addresses reunification only when it is safe and in the child's best interests`,
    );
  }

  // Business rule: Reunification decision requires child views
  if (
    input.planningStage === "Reunification Decision" &&
    input.childViewsObtained === false
  ) {
    errors.push(
      `Reunification decision cannot be made without obtaining the child's views — Children Act 1989 s1(3)(a) requires that the court has regard to the ascertainable wishes and feelings of the child. The child's views are central to any reunification decision. SCCIF inspectors will expect clear evidence that the child's voice has been heard and weighted in the decision-making process`,
    );
  }

  // Business rule: Transition plan requires parenting assessment
  if (
    input.planningStage === "Transition Plan" &&
    input.parentingAssessmentCompleted === false
  ) {
    errors.push(
      `Transition plan should not proceed without a completed parenting assessment — the DfE reunification practice framework requires evidence that the parent has the capacity to meet the child's needs. Without a parenting assessment, the transition plan lacks an evidence base and may place the child at risk`,
    );
  }

  // Business rule: Actual return date should not be before estimated return date
  if (input.actualReturnDate && input.estimatedReturnDate) {
    const actual = new Date(input.actualReturnDate);
    const estimated = new Date(input.estimatedReturnDate);
    if (actual.getTime() < estimated.getTime() - 30 * 24 * 60 * 60 * 1000) {
      // Advisory: significantly early return may indicate insufficient preparation
    }
  }

  // Business rule: Reunification decision without home suitability check
  if (
    input.planningStage &&
    (DECISION_STAGES as string[]).includes(input.planningStage) &&
    input.homeSuitable === null
  ) {
    errors.push(
      `${input.planningStage} requires a home suitability assessment — Care Planning Regulations 2010 require that the home environment is assessed before reunification proceeds. The child's safety and welfare in the family home must be assured`,
    );
  }

  // Business rule: IRO should be consulted for decision stages
  if (
    input.planningStage &&
    (DECISION_STAGES as string[]).includes(input.planningStage) &&
    input.independentReviewingOfficerConsulted === false
  ) {
    errors.push(
      `The Independent Reviewing Officer must be consulted before a reunification decision or transition plan — the IRO has a statutory duty to monitor the child's care plan and ensure that any change, including reunification, is in the child's best interests. IRO consultation is required under the IRO Handbook and Care Planning Regulations 2010`,
    );
  }

  return { valid: errors.length === 0, errors };
}

// -- Pure functions (no DB) ---------------------------------------------------

export function computeMetrics(
  rows: FamilyReunificationRow[],
): {
  total_records: number;
  by_planning_stage: Record<string, number>;
  by_relationship: Record<string, number>;
  by_status: Record<string, number>;
  risk_assessment_rate: number;
  safeguarding_cleared_rate: number;
  child_views_rate: number;
  child_wishes_return_rate: number;
  family_support_rate: number;
  parenting_assessment_rate: number;
  home_suitability_assessed_rate: number;
  la_support_plan_rate: number;
  school_transition_rate: number;
  health_transfer_rate: number;
  iro_rate: number;
  legal_advice_rate: number;
  successful_reunification_count: number;
  failed_reunification_count: number;
  success_rate: number;
  average_time_assessment_to_return: number;
  post_return_monitoring_rate: number;
  unique_children: number;
  active_planning_count: number;
  on_hold_count: number;
  parent_return_count: number;
  extended_family_return_count: number;
} {
  const total = rows.length;

  // Unique children
  const uniqueChildren = new Set(rows.map((r) => r.child_name.toLowerCase().trim()));

  // Planning stage breakdown
  const byPlanningStage: Record<string, number> = {};
  for (const ps of PLANNING_STAGES) byPlanningStage[ps] = 0;
  for (const r of rows) byPlanningStage[r.planning_stage] = (byPlanningStage[r.planning_stage] || 0) + 1;

  // Relationship breakdown
  const byRelationship: Record<string, number> = {};
  for (const rel of RELATIONSHIPS) byRelationship[rel] = 0;
  for (const r of rows) byRelationship[r.relationship] = (byRelationship[r.relationship] || 0) + 1;

  // Status breakdown
  const byStatus: Record<string, number> = {};
  for (const s of STATUSES) byStatus[s] = 0;
  for (const r of rows) byStatus[r.status] = (byStatus[r.status] || 0) + 1;

  // Boolean rates
  const riskRate = total > 0
    ? Math.round((rows.filter((r) => r.risk_assessment_current).length / total) * 1000) / 10
    : 0;

  const safeguardingRate = total > 0
    ? Math.round((rows.filter((r) => r.safeguarding_cleared).length / total) * 1000) / 10
    : 0;

  const childViewsRate = total > 0
    ? Math.round((rows.filter((r) => r.child_views_obtained).length / total) * 1000) / 10
    : 0;

  // Child wishes to return rate (of those where views were obtained)
  const viewsObtained = rows.filter((r) => r.child_views_obtained);
  const wishesReturn = viewsObtained.filter((r) => r.child_wishes_to_return === true);
  const childWishesRate = viewsObtained.length > 0
    ? Math.round((wishesReturn.length / viewsObtained.length) * 1000) / 10
    : 0;

  const familySupportRate = total > 0
    ? Math.round((rows.filter((r) => r.family_support_services).length / total) * 1000) / 10
    : 0;

  const parentingAssessmentRate = total > 0
    ? Math.round((rows.filter((r) => r.parenting_assessment_completed).length / total) * 1000) / 10
    : 0;

  const homeSuitabilityRate = total > 0
    ? Math.round((rows.filter((r) => r.home_suitable !== null).length / total) * 1000) / 10
    : 0;

  const laSupportRate = total > 0
    ? Math.round((rows.filter((r) => r.local_authority_support_plan).length / total) * 1000) / 10
    : 0;

  const schoolTransitionRate = total > 0
    ? Math.round((rows.filter((r) => r.school_transition_planned).length / total) * 1000) / 10
    : 0;

  const healthTransferRate = total > 0
    ? Math.round((rows.filter((r) => r.health_services_transferred).length / total) * 1000) / 10
    : 0;

  const iroRate = total > 0
    ? Math.round((rows.filter((r) => r.independent_reviewing_officer_consulted).length / total) * 1000) / 10
    : 0;

  const legalRate = total > 0
    ? Math.round((rows.filter((r) => r.legal_advice_obtained).length / total) * 1000) / 10
    : 0;

  // Successful and failed reunification counts
  const successfulCount = rows.filter((r) => r.status === "Reunification Successful").length;
  const failedCount = rows.filter((r) => r.status === "Reunification Failed").length;
  const concludedCount = successfulCount + failedCount;
  const successRate = concludedCount > 0
    ? Math.round((successfulCount / concludedCount) * 1000) / 10
    : 0;

  // Average time from assessment to return (days)
  const returnsWithDates = rows.filter(
    (r) => r.actual_return_date !== null,
  );
  let totalDaysToReturn = 0;
  let returnsWithAssessment = 0;
  for (const r of returnsWithDates) {
    // Find earliest assessment record for same child
    const childRows = rows.filter(
      (cr) =>
        cr.child_name.toLowerCase().trim() === r.child_name.toLowerCase().trim() &&
        (ASSESSMENT_STAGES as string[]).includes(cr.planning_stage),
    );
    if (childRows.length > 0) {
      const earliestAssessment = childRows.sort((a, b) =>
        a.record_date.localeCompare(b.record_date),
      )[0];
      const assessmentDate = new Date(earliestAssessment.record_date);
      const returnDate = new Date(r.actual_return_date!);
      const days = Math.round((returnDate.getTime() - assessmentDate.getTime()) / (1000 * 60 * 60 * 24));
      if (days >= 0) {
        totalDaysToReturn += days;
        returnsWithAssessment++;
      }
    }
  }
  const avgTimeToReturn = returnsWithAssessment > 0
    ? Math.round((totalDaysToReturn / returnsWithAssessment) * 10) / 10
    : 0;

  // Post-return monitoring rate
  const postReturnRows = rows.filter(
    (r) =>
      r.status === "Reunification Successful" ||
      r.planning_stage === "Post-Reunification Support",
  );
  const monitoredCount = postReturnRows.filter(
    (r) => r.post_return_monitoring_weeks !== null && r.post_return_monitoring_weeks > 0,
  ).length;
  const postReturnMonitoringRate = postReturnRows.length > 0
    ? Math.round((monitoredCount / postReturnRows.length) * 1000) / 10
    : 0;

  // Active planning and on hold counts
  const activePlanningCount = rows.filter((r) => r.status === "Active Planning").length;
  const onHoldCount = rows.filter((r) => r.status === "On Hold").length;

  // Parent vs extended family return
  const parentReturnCount = rows.filter(
    (r) => (PARENT_RELATIONSHIPS as string[]).includes(r.relationship),
  ).length;
  const extendedFamilyCount = rows.filter(
    (r) => (EXTENDED_FAMILY_RELATIONSHIPS as string[]).includes(r.relationship),
  ).length;

  return {
    total_records: total,
    by_planning_stage: byPlanningStage,
    by_relationship: byRelationship,
    by_status: byStatus,
    risk_assessment_rate: riskRate,
    safeguarding_cleared_rate: safeguardingRate,
    child_views_rate: childViewsRate,
    child_wishes_return_rate: childWishesRate,
    family_support_rate: familySupportRate,
    parenting_assessment_rate: parentingAssessmentRate,
    home_suitability_assessed_rate: homeSuitabilityRate,
    la_support_plan_rate: laSupportRate,
    school_transition_rate: schoolTransitionRate,
    health_transfer_rate: healthTransferRate,
    iro_rate: iroRate,
    legal_advice_rate: legalRate,
    successful_reunification_count: successfulCount,
    failed_reunification_count: failedCount,
    success_rate: successRate,
    average_time_assessment_to_return: avgTimeToReturn,
    post_return_monitoring_rate: postReturnMonitoringRate,
    unique_children: uniqueChildren.size,
    active_planning_count: activePlanningCount,
    on_hold_count: onHoldCount,
    parent_return_count: parentReturnCount,
    extended_family_return_count: extendedFamilyCount,
  };
}

export function computeAlerts(
  rows: FamilyReunificationRow[],
): {
  type: string;
  severity: "critical" | "high" | "medium";
  message: string;
  record_id?: string;
}[] {
  const alerts: {
    type: string;
    severity: "critical" | "high" | "medium";
    message: string;
    record_id?: string;
  }[] = [];

  // Critical: Trial or decision stage without risk assessment
  for (const r of rows) {
    if (
      ((TRIAL_STAGES as string[]).includes(r.planning_stage) ||
        (DECISION_STAGES as string[]).includes(r.planning_stage)) &&
      !r.risk_assessment_current
    ) {
      alerts.push({
        type: "no_risk_assessment_trial_decision",
        severity: "critical",
        message: `${r.child_name}'s reunification is at "${r.planning_stage}" stage without a current risk assessment — Care Planning Regulations 2010 Part 5 requires that the child's safety is the paramount consideration when ceasing to look after a child. No trial stay or reunification decision should proceed without an up-to-date risk assessment. The risk assessment must consider the original reasons for the child entering care and whether those risks have been sufficiently addressed`,
        record_id: r.id,
      });
    }
  }

  // Critical: Reunification proceeding without safeguarding clearance
  for (const r of rows) {
    if (
      (DECISION_STAGES as string[]).includes(r.planning_stage) &&
      !r.safeguarding_cleared
    ) {
      alerts.push({
        type: "no_safeguarding_clearance",
        severity: "critical",
        message: `${r.child_name}'s reunification has reached "${r.planning_stage}" without safeguarding clearance — this is a fundamental safety requirement. Children Act 1989 s1(1) establishes that the child's welfare is paramount. Reunification must not proceed until all safeguarding concerns have been assessed and cleared by the appropriate professionals. SCCIF explicitly states that children return to families only "when safe"`,
        record_id: r.id,
      });
    }
  }

  // Critical: Post-reunification breakdown
  for (const r of rows) {
    if (r.planning_stage === "Breakdown — Return to Care") {
      alerts.push({
        type: "reunification_breakdown",
        severity: "critical",
        message: `${r.child_name}'s reunification with ${r.family_member} (${r.relationship}) has broken down — the child is returning to care. This is a traumatic experience for the child and family. An immediate review is required to understand what went wrong, what support was missing, and how the child's needs will be met going forward. The IRO must be informed and a disruption meeting held. Was the reunification adequately supported? Were warning signs missed? Was post-return monitoring sufficient?`,
        record_id: r.id,
      });
    }
  }

  // Critical: Decision stage without child views
  for (const r of rows) {
    if (
      (DECISION_STAGES as string[]).includes(r.planning_stage) &&
      !r.child_views_obtained
    ) {
      alerts.push({
        type: "no_child_views_decision",
        severity: "critical",
        message: `${r.child_name}'s reunification has reached "${r.planning_stage}" without the child's views being obtained — Children Act 1989 s1(3)(a) requires that the child's wishes and feelings are ascertained. UNCRC Article 12 guarantees the child's right to be heard in proceedings affecting them. A reunification decision made without the child's voice is procedurally unsafe and ethically wrong. The child may have views about the family member, the home, and their own safety that must inform the decision`,
        record_id: r.id,
      });
    }
  }

  // High: No IRO consultation for decision stages
  for (const r of rows) {
    if (
      (DECISION_STAGES as string[]).includes(r.planning_stage) &&
      !r.independent_reviewing_officer_consulted
    ) {
      alerts.push({
        type: "no_iro_decision",
        severity: "high",
        message: `${r.child_name}'s ${r.planning_stage} has not involved the IRO — the Independent Reviewing Officer has a statutory duty to monitor care plans and ensure that any significant change is in the child's best interests. The IRO Handbook requires consultation before reunification decisions. Without IRO oversight, there is no independent check on the decision-making process`,
        record_id: r.id,
      });
    }
  }

  // High: No parenting assessment completed for trial/decision stages
  for (const r of rows) {
    if (
      ((TRIAL_STAGES as string[]).includes(r.planning_stage) ||
        (DECISION_STAGES as string[]).includes(r.planning_stage)) &&
      !r.parenting_assessment_completed
    ) {
      alerts.push({
        type: "no_parenting_assessment",
        severity: "high",
        message: `${r.child_name}'s reunification with ${r.family_member} is at "${r.planning_stage}" without a completed parenting assessment — the DfE reunification practice framework requires evidence that the parent or carer has the capacity to meet the child's needs safely. Without a parenting assessment, the reunification plan lacks an evidence base`,
        record_id: r.id,
      });
    }
  }

  // High: No family support services in place for active reunification
  const activeReunifications = rows.filter(
    (r) =>
      (TRIAL_STAGES as string[]).includes(r.planning_stage) ||
      (DECISION_STAGES as string[]).includes(r.planning_stage) ||
      r.planning_stage === "Post-Reunification Support",
  );
  const noFamilySupport = activeReunifications.filter((r) => !r.family_support_services);
  if (noFamilySupport.length >= 2) {
    alerts.push({
      type: "no_family_support_services",
      severity: "high",
      message: `${noFamilySupport.length} active reunifications have no family support services in place — the DfE reunification practice framework emphasises that successful reunification requires robust family support. Without support services, the family is left to manage the transition alone, significantly increasing the risk of breakdown. Support may include family therapy, parenting support, housing, financial assistance, and access to community services`,
    });
  }

  // High: No legal advice for cases with court orders
  for (const r of rows) {
    if (
      r.court_order_status &&
      r.court_order_status.trim().length > 0 &&
      !r.legal_advice_obtained
    ) {
      alerts.push({
        type: "court_order_no_legal_advice",
        severity: "high",
        message: `${r.child_name}'s case has court order status "${r.court_order_status}" but no legal advice has been obtained — reunification where court orders are in place requires legal guidance to ensure compliance with the order and proper discharge. Failure to obtain legal advice may result in procedural irregularities that could be challenged`,
        record_id: r.id,
      });
    }
  }

  // High: Low child views rate overall
  const childViewsCount = rows.filter((r) => r.child_views_obtained).length;
  if (rows.length >= 5 && childViewsCount / rows.length < 0.5) {
    alerts.push({
      type: "low_child_views_rate",
      severity: "high",
      message: `Child views obtained in only ${Math.round((childViewsCount / rows.length) * 100)}% of reunification records — UNCRC Article 12 and the Children Act 1989 require that children's views are sought in all matters affecting them. Reunification is one of the most significant decisions in a child's life. Their voice must be present throughout the process, not just at the decision point`,
    });
  }

  // High: No school transition planned for transition/post-return stages
  for (const r of rows) {
    if (
      (r.planning_stage === "Transition Plan" || r.planning_stage === "Post-Reunification Support") &&
      !r.school_transition_planned
    ) {
      alerts.push({
        type: "no_school_transition",
        severity: "high",
        message: `${r.child_name}'s reunification is at "${r.planning_stage}" without school transition planning — if the child is changing school as part of reunification, this must be planned carefully to minimise disruption to their education. If they are staying at the same school, transport arrangements may need to change. Educational stability is a key factor in successful reunification`,
        record_id: r.id,
      });
    }
  }

  // Medium: No post-return monitoring
  const successfulNoMonitoring = rows.filter(
    (r) =>
      r.status === "Reunification Successful" &&
      (r.post_return_monitoring_weeks === null || r.post_return_monitoring_weeks === 0),
  );
  if (successfulNoMonitoring.length > 0) {
    alerts.push({
      type: "no_post_return_monitoring",
      severity: "medium",
      message: `${successfulNoMonitoring.length} successful reunification${successfulNoMonitoring.length === 1 ? "" : "s"} ${successfulNoMonitoring.length === 1 ? "has" : "have"} no post-return monitoring period recorded — the DfE reunification practice framework recommends a minimum 12-week post-return monitoring period. Research shows that the first three months after reunification are the highest risk for breakdown. Without structured monitoring, early warning signs may be missed`,
    });
  }

  // Medium: Low LA support plan rate
  const laSupportCount = rows.filter((r) => r.local_authority_support_plan).length;
  if (rows.length >= 5 && laSupportCount / rows.length < 0.4) {
    alerts.push({
      type: "low_la_support_plan",
      severity: "medium",
      message: `LA support plan in place for only ${Math.round((laSupportCount / rows.length) * 100)}% of reunification records — local authority support is critical to successful reunification. Care Planning Regulations 2010 require that a plan is in place to support the child and family after the child ceases to be looked after. Without an LA support plan, the family may lack access to ongoing services`,
    });
  }

  // Medium: No health service transfer for transition stages
  for (const r of rows) {
    if (
      r.planning_stage === "Transition Plan" &&
      !r.health_services_transferred
    ) {
      alerts.push({
        type: "no_health_transfer",
        severity: "medium",
        message: `${r.child_name}'s transition plan does not include health service transfer — if the child is moving area, they will need to register with new GP, dentist, and any specialist services. If staying in the same area, continuity of existing health services should be confirmed. Looked-after children often have complex health needs that must not fall through the gaps during reunification`,
        record_id: r.id,
      });
    }
  }

  // Medium: Cases on hold for extended period (multiple records on hold)
  const onHoldChildren = new Map<string, FamilyReunificationRow[]>();
  for (const r of rows) {
    if (r.status === "On Hold") {
      const key = r.child_name.toLowerCase().trim();
      if (!onHoldChildren.has(key)) onHoldChildren.set(key, []);
      onHoldChildren.get(key)!.push(r);
    }
  }
  for (const [, childRows] of onHoldChildren) {
    if (childRows.length >= 2) {
      alerts.push({
        type: "extended_on_hold",
        severity: "medium",
        message: `${childRows[0].child_name}'s reunification has ${childRows.length} records with "On Hold" status — extended periods on hold create uncertainty for the child and family. What is preventing progress? Is the case being actively reviewed? The IRO should be considering whether reunification remains a realistic plan or whether alternative permanence options should be explored`,
      });
    }
  }

  return alerts;
}

export function generateCaraInsights(
  rows: FamilyReunificationRow[],
): string[] {
  const metrics = computeMetrics(rows);
  const alerts = computeAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary overview
  const stageBreakdown = Object.entries(metrics.by_planning_stage)
    .filter(([, count]) => count > 0)
    .map(([stage, count]) => `${stage}: ${count}`)
    .join(", ");

  const statusBreakdown = Object.entries(metrics.by_status)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => `${status}: ${count}`)
    .join(", ");

  const relationshipBreakdown = Object.entries(metrics.by_relationship)
    .filter(([, count]) => count > 0)
    .map(([rel, count]) => `${rel}: ${count}`)
    .join(", ");

  insights.push(
    `[sky] ${metrics.total_records} family reunification ${metrics.total_records === 1 ? "record" : "records"} ` +
      `for ${metrics.unique_children} ${metrics.unique_children === 1 ? "child" : "children"}. ` +
      `Stages: ${stageBreakdown || "none"}. ` +
      `Status: ${statusBreakdown || "none"}. ` +
      `Relationships: ${relationshipBreakdown || "none"}. ` +
      `Active planning: ${metrics.active_planning_count}. On hold: ${metrics.on_hold_count}. ` +
      `Successful: ${metrics.successful_reunification_count}. Failed: ${metrics.failed_reunification_count}. ` +
      `Success rate: ${metrics.success_rate}%. ` +
      `Average assessment to return: ${metrics.average_time_assessment_to_return} days. ` +
      `Risk assessment rate: ${metrics.risk_assessment_rate}%. ` +
      `Child views rate: ${metrics.child_views_rate}%.`,
  );

  // Insight 2: Quality indicators and alerts
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");

  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority alerts. ` +
        `Safeguarding cleared: ${metrics.safeguarding_cleared_rate}%. ` +
        `Child wishes to return: ${metrics.child_wishes_return_rate}%. ` +
        `Family support: ${metrics.family_support_rate}%. ` +
        `Parenting assessment: ${metrics.parenting_assessment_rate}%. ` +
        `Home suitability assessed: ${metrics.home_suitability_assessed_rate}%. ` +
        `LA support plan: ${metrics.la_support_plan_rate}%. ` +
        `School transition: ${metrics.school_transition_rate}%. ` +
        `Health transfer: ${metrics.health_transfer_rate}%. ` +
        `IRO consulted: ${metrics.iro_rate}%. ` +
        `Legal advice: ${metrics.legal_advice_rate}%. ` +
        `Post-return monitoring: ${metrics.post_return_monitoring_rate}%.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority reunification alerts. ` +
        `Safeguarding cleared: ${metrics.safeguarding_cleared_rate}%. ` +
        `Child wishes to return: ${metrics.child_wishes_return_rate}%. ` +
        `Family support: ${metrics.family_support_rate}%. ` +
        `Parenting assessment: ${metrics.parenting_assessment_rate}%. ` +
        `Home suitability assessed: ${metrics.home_suitability_assessed_rate}%. ` +
        `LA support plan: ${metrics.la_support_plan_rate}%. ` +
        `School transition: ${metrics.school_transition_rate}%. ` +
        `Health transfer: ${metrics.health_transfer_rate}%. ` +
        `IRO consulted: ${metrics.iro_rate}%. ` +
        `Legal advice: ${metrics.legal_advice_rate}%. ` +
        `Post-return monitoring: ${metrics.post_return_monitoring_rate}%. ` +
        `Continue following the DfE reunification practice framework.`,
    );
  }

  // Insight 3: Reflective question
  if (metrics.failed_reunification_count > 0 && metrics.total_records > 3) {
    insights.push(
      `[reflect] ${metrics.failed_reunification_count} reunification${metrics.failed_reunification_count === 1 ? " has" : "s have"} ` +
        `failed — each failed reunification represents a child who went home, ` +
        `experienced the return not working, and came back into care. Research ` +
        `consistently shows that failed reunification is one of the most damaging ` +
        `experiences for a looked-after child — it confirms their worst fears about ` +
        `family, compounds attachment disruption, and can set back therapeutic ` +
        `progress significantly. The DfE reunification practice framework ` +
        `emphasises that reunification should only proceed when there is robust ` +
        `evidence that the family can meet the child's needs safely and sustainably. ` +
        `Were these reunifications adequately assessed? Was post-return support ` +
        `sufficient? Were warning signs acted on? What lessons can inform future ` +
        `reunification planning?`,
    );
  } else if (metrics.risk_assessment_rate < 70 && metrics.total_records > 3) {
    insights.push(
      `[reflect] Risk assessment rate is ${metrics.risk_assessment_rate}% across ` +
        `reunification records. The child entered care for a reason — and that ` +
        `reason must be thoroughly assessed before any return is considered. ` +
        `Care Planning Regulations 2010 Part 5 require that the safety analysis ` +
        `is rigorous and current. A risk assessment is not a one-off exercise; ` +
        `it must be updated at each stage of the reunification process as ` +
        `circumstances change. Is the home ensuring that every stage transition ` +
        `is preceded by an updated risk assessment? Are assessments genuinely ` +
        `analytical or merely procedural?`,
    );
  } else if (metrics.post_return_monitoring_rate < 50 && metrics.successful_reunification_count > 0) {
    insights.push(
      `[reflect] Post-return monitoring rate is ${metrics.post_return_monitoring_rate}% ` +
        `for completed reunifications. The DfE reunification practice framework ` +
        `recommends a minimum 12-week monitoring period — research shows this is ` +
        `when reunification is most fragile. Without structured post-return ` +
        `monitoring, the family is effectively left to manage alone during the ` +
        `most critical period. Are monitoring visits happening regularly? Is ` +
        `someone checking on the child's welfare, school attendance, and ` +
        `emotional state? Are family support services continuing or have they ` +
        `been withdrawn prematurely? SCCIF expects that when children return ` +
        `home, they do so "with appropriate support" — what does "appropriate" ` +
        `look like in practice for each family?`,
    );
  } else {
    insights.push(
      `[reflect] Family reunification is one of the most consequential decisions ` +
        `in a child's care journey. SCCIF: Overall experiences states that "when ` +
        `safe, children return to their families with appropriate support." Every ` +
        `word of that statement matters: "when safe" (not when convenient or ` +
        `when pressured), "return to their families" (with genuine family ` +
        `connection), "with appropriate support" (not abandoned after the move). ` +
        `Is the home's reunification practice genuinely child-centred, or is it ` +
        `driven by system pressures? Are children's wishes given genuine weight, ` +
        `or tokenistically recorded? Is the home confident that its reunification ` +
        `decisions would withstand scrutiny from Ofsted, the courts, and most ` +
        `importantly the children themselves in years to come?`,
    );
  }

  return insights;
}

// -- CRUD ---------------------------------------------------------------------

export async function listRecords(
  homeId: string,
  filters?: {
    planningStage?: PlanningStage;
    relationship?: Relationship;
    status?: ReunificationStatus;
    limit?: number;
  },
): Promise<ServiceResult<FamilyReunificationRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const client = await createServerClient();
  if (!client) return { ok: true, data: [] };

  let q = (client.from("cs_family_reunification") as SB)
    .select("*")
    .eq("home_id", homeId);

  if (filters?.planningStage) q = q.eq("planning_stage", filters.planningStage);
  if (filters?.relationship) q = q.eq("relationship", filters.relationship);
  if (filters?.status) q = q.eq("status", filters.status);

  q = q.order("record_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getRecord(
  id: string,
): Promise<ServiceResult<FamilyReunificationRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_family_reunification") as SB)
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function createRecord(input: {
  homeId: string;
  childName: string;
  recordDate: string;
  socialWorkerName: string;
  planningStage: PlanningStage;
  familyMember: string;
  relationship: Relationship;
  riskAssessmentCurrent?: boolean;
  safeguardingCleared?: boolean;
  childViewsObtained?: boolean;
  childWishesToReturn?: boolean | null;
  familySupportServices?: boolean;
  parentingAssessmentCompleted?: boolean;
  homeSuitable?: boolean | null;
  localAuthoritySupportPlan?: boolean;
  schoolTransitionPlanned?: boolean;
  healthServicesTransferred?: boolean;
  independentReviewingOfficerConsulted?: boolean;
  legalAdviceObtained?: boolean;
  courtOrderStatus?: string | null;
  estimatedReturnDate?: string | null;
  actualReturnDate?: string | null;
  postReturnMonitoringWeeks?: number | null;
  status?: ReunificationStatus;
  notes?: string | null;
}): Promise<ServiceResult<FamilyReunificationRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const validation = validateFamilyReunification({
    childName: input.childName,
    recordDate: input.recordDate,
    socialWorkerName: input.socialWorkerName,
    planningStage: input.planningStage,
    familyMember: input.familyMember,
    relationship: input.relationship,
    status: input.status,
    riskAssessmentCurrent: input.riskAssessmentCurrent,
    safeguardingCleared: input.safeguardingCleared,
    childViewsObtained: input.childViewsObtained,
    childWishesToReturn: input.childWishesToReturn,
    parentingAssessmentCompleted: input.parentingAssessmentCompleted,
    homeSuitable: input.homeSuitable,
    independentReviewingOfficerConsulted: input.independentReviewingOfficerConsulted,
    legalAdviceObtained: input.legalAdviceObtained,
    estimatedReturnDate: input.estimatedReturnDate,
    actualReturnDate: input.actualReturnDate,
    postReturnMonitoringWeeks: input.postReturnMonitoringWeeks,
  });
  if (!validation.valid) {
    return { ok: false, error: validation.errors.join("; ") };
  }

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_family_reunification") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      record_date: input.recordDate,
      social_worker_name: input.socialWorkerName,
      planning_stage: input.planningStage,
      family_member: input.familyMember,
      relationship: input.relationship,
      risk_assessment_current: input.riskAssessmentCurrent ?? false,
      safeguarding_cleared: input.safeguardingCleared ?? false,
      child_views_obtained: input.childViewsObtained ?? false,
      child_wishes_to_return: input.childWishesToReturn ?? null,
      family_support_services: input.familySupportServices ?? false,
      parenting_assessment_completed: input.parentingAssessmentCompleted ?? false,
      home_suitable: input.homeSuitable ?? null,
      local_authority_support_plan: input.localAuthoritySupportPlan ?? false,
      school_transition_planned: input.schoolTransitionPlanned ?? false,
      health_services_transferred: input.healthServicesTransferred ?? false,
      independent_reviewing_officer_consulted: input.independentReviewingOfficerConsulted ?? false,
      legal_advice_obtained: input.legalAdviceObtained ?? false,
      court_order_status: input.courtOrderStatus ?? null,
      estimated_return_date: input.estimatedReturnDate ?? null,
      actual_return_date: input.actualReturnDate ?? null,
      post_return_monitoring_weeks: input.postReturnMonitoringWeeks ?? null,
      status: input.status ?? "Active Planning",
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateRecord(
  id: string,
  updates: Partial<{
    childName: string;
    recordDate: string;
    socialWorkerName: string;
    planningStage: PlanningStage;
    familyMember: string;
    relationship: Relationship;
    riskAssessmentCurrent: boolean;
    safeguardingCleared: boolean;
    childViewsObtained: boolean;
    childWishesToReturn: boolean | null;
    familySupportServices: boolean;
    parentingAssessmentCompleted: boolean;
    homeSuitable: boolean | null;
    localAuthoritySupportPlan: boolean;
    schoolTransitionPlanned: boolean;
    healthServicesTransferred: boolean;
    independentReviewingOfficerConsulted: boolean;
    legalAdviceObtained: boolean;
    courtOrderStatus: string | null;
    estimatedReturnDate: string | null;
    actualReturnDate: string | null;
    postReturnMonitoringWeeks: number | null;
    status: ReunificationStatus;
    notes: string | null;
  }>,
): Promise<ServiceResult<FamilyReunificationRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.recordDate !== undefined) mapped.record_date = updates.recordDate;
  if (updates.socialWorkerName !== undefined) mapped.social_worker_name = updates.socialWorkerName;
  if (updates.planningStage !== undefined) mapped.planning_stage = updates.planningStage;
  if (updates.familyMember !== undefined) mapped.family_member = updates.familyMember;
  if (updates.relationship !== undefined) mapped.relationship = updates.relationship;
  if (updates.riskAssessmentCurrent !== undefined) mapped.risk_assessment_current = updates.riskAssessmentCurrent;
  if (updates.safeguardingCleared !== undefined) mapped.safeguarding_cleared = updates.safeguardingCleared;
  if (updates.childViewsObtained !== undefined) mapped.child_views_obtained = updates.childViewsObtained;
  if (updates.childWishesToReturn !== undefined) mapped.child_wishes_to_return = updates.childWishesToReturn;
  if (updates.familySupportServices !== undefined) mapped.family_support_services = updates.familySupportServices;
  if (updates.parentingAssessmentCompleted !== undefined) mapped.parenting_assessment_completed = updates.parentingAssessmentCompleted;
  if (updates.homeSuitable !== undefined) mapped.home_suitable = updates.homeSuitable;
  if (updates.localAuthoritySupportPlan !== undefined) mapped.local_authority_support_plan = updates.localAuthoritySupportPlan;
  if (updates.schoolTransitionPlanned !== undefined) mapped.school_transition_planned = updates.schoolTransitionPlanned;
  if (updates.healthServicesTransferred !== undefined) mapped.health_services_transferred = updates.healthServicesTransferred;
  if (updates.independentReviewingOfficerConsulted !== undefined) mapped.independent_reviewing_officer_consulted = updates.independentReviewingOfficerConsulted;
  if (updates.legalAdviceObtained !== undefined) mapped.legal_advice_obtained = updates.legalAdviceObtained;
  if (updates.courtOrderStatus !== undefined) mapped.court_order_status = updates.courtOrderStatus;
  if (updates.estimatedReturnDate !== undefined) mapped.estimated_return_date = updates.estimatedReturnDate;
  if (updates.actualReturnDate !== undefined) mapped.actual_return_date = updates.actualReturnDate;
  if (updates.postReturnMonitoringWeeks !== undefined) mapped.post_return_monitoring_weeks = updates.postReturnMonitoringWeeks;
  if (updates.status !== undefined) mapped.status = updates.status;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  mapped.updated_at = new Date().toISOString();

  const { data, error } = await (client.from("cs_family_reunification") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function deleteRecord(
  id: string,
): Promise<ServiceResult<null>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { error } = await (client.from("cs_family_reunification") as SB)
    .delete()
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: null };
}
