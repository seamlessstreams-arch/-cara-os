// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Reg 44 Compliance Intelligence Engine
//
// Pure deterministic engine. No AI, no external calls, no side-effects.
//
// Maps to:
//   CHR 2015 Reg 44  — Independent person: visits and reports
//   CHR 2015 Reg 45  — Review of quality of care
//   SCCIF             — Leadership & management quality assurance
//   NMS 25            — Monitoring by independent person
//
// Regulatory requirements:
//   1. Independent person visits at least monthly
//   2. Visitor must be independent of the provider
//   3. Report produced after each visit and submitted to Ofsted
//   4. Children spoken to and their views captured
//   5. Recommendations tracked with assigned owners & target dates
//   6. Management responds to visit reports promptly
//   7. Action plans created and shared with Responsible Individual
//   8. Impact of completed recommendations assessed
//
// Scoring breakdown (0-100):
//   Visit compliance:        30 (monthly frequency, independence, quality, timeliness)
//   Recommendations:         25 (completion, timeliness, impact)
//   Child participation:     25 (coverage, voice, action on issues)
//   Management response:     20 (timeliness, acceptance, action plans)
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ─────────────────────────────────────────────────────────────────────

export type VisitFocus =
  | "overall_quality"
  | "safeguarding"
  | "behaviour"
  | "education"
  | "health"
  | "environment"
  | "staffing"
  | "complaints"
  | "children_views"
  | "records";

export type RecommendationPriority = "immediate" | "high" | "medium" | "low";

export type RecommendationStatus =
  | "open"
  | "in_progress"
  | "completed"
  | "overdue"
  | "rejected";

// ── Data Models ───────────────────────────────────────────────────────────────

export interface Reg44Visit {
  id: string;
  homeId: string;
  visitDate: string;
  visitor: string;
  visitorIndependent: boolean;
  childrenSpokenTo: number;
  totalChildren: number;
  staffSpokenTo: number;
  recordsReviewed: boolean;
  environmentInspected: boolean;
  focusAreas: VisitFocus[];
  overallRating: "outstanding" | "good" | "requires_improvement" | "inadequate";
  positiveFindings: string[];
  concerns: string[];
  reportSubmittedDate: string;
  reportSubmittedOnTime: boolean;
  sharedWithOfsted: boolean;
}

export interface Reg44Recommendation {
  id: string;
  homeId: string;
  visitId: string;
  description: string;
  priority: RecommendationPriority;
  status: RecommendationStatus;
  assignedTo: string;
  targetDate: string;
  completedDate?: string;
  evidenceOfCompletion?: string;
  impactAssessed: boolean;
}

export interface ChildParticipation {
  id: string;
  homeId: string;
  visitId: string;
  childId: string;
  childName: string;
  spokenTo: boolean;
  viewsCaptured: boolean;
  feedbackPositive: boolean;
  issuesRaised: string[];
  issuesActioned: boolean;
}

export interface ManagementResponse {
  id: string;
  homeId: string;
  visitId: string;
  responseDate: string;
  respondedOnTime: boolean;
  acceptedRecommendations: number;
  rejectedRecommendations: number;
  rejectionReasons: string[];
  actionPlanCreated: boolean;
  sharedWithRI: boolean;
}

// ── Result Types ──────────────────────────────────────────────────────────────

export interface VisitComplianceResult {
  totalVisitsExpected: number;
  totalVisitsCompleted: number;
  visitCompletionRate: number;
  independentVisitorRate: number;
  nonIndependentVisits: string[];
  averageChildrenSpoken: number;
  averageStaffSpoken: number;
  recordsReviewedRate: number;
  environmentInspectedRate: number;
  reportOnTimeRate: number;
  ofstedSharedRate: number;
  ratingBreakdown: { rating: string; count: number }[];
  focusAreaCoverage: { area: VisitFocus; count: number }[];
  missedMonths: string[];
  longestGapDays: number;
  averageConcernsPerVisit: number;
  averagePositiveFindingsPerVisit: number;
}

export interface RecommendationResult {
  totalRecommendations: number;
  completedCount: number;
  completionRate: number;
  openCount: number;
  inProgressCount: number;
  overdueCount: number;
  rejectedCount: number;
  overdueRate: number;
  priorityBreakdown: { priority: RecommendationPriority; count: number; completedCount: number }[];
  averageCompletionDays: number;
  impactAssessedRate: number;
  withEvidenceRate: number;
  overdueRecommendations: { id: string; description: string; priority: RecommendationPriority; targetDate: string }[];
}

export interface ChildParticipationResult {
  totalRecords: number;
  childrenSpokenToRate: number;
  viewsCapturedRate: number;
  positiveFeedbackRate: number;
  totalIssuesRaised: number;
  issuesActionedRate: number;
  childCoverage: number;
  childCoverageBreakdown: { childId: string; childName: string; timesSpokenTo: number; totalVisits: number }[];
  unheardChildren: { childId: string; childName: string }[];
}

export interface ManagementResponseResult {
  totalResponses: number;
  respondedOnTimeRate: number;
  averageAcceptanceRate: number;
  averageRejectionRate: number;
  actionPlanCreatedRate: number;
  sharedWithRIRate: number;
  totalRejectionReasons: string[];
  visitsMissingResponse: string[];
}

export interface VisitTimelineEntry {
  visitId: string;
  visitDate: string;
  visitor: string;
  overallRating: string;
  recommendationCount: number;
  completedRecommendations: number;
  childrenParticipated: number;
  totalChildren: number;
  hasManagementResponse: boolean;
  respondedOnTime: boolean;
  concerns: string[];
  positiveFindings: string[];
}

export interface Reg44ComplianceIntelligenceResult {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  referenceDate: string;
  overallScore: number;
  rating: "outstanding" | "good" | "requires_improvement" | "inadequate";
  visitCompliance: VisitComplianceResult;
  recommendations: RecommendationResult;
  childParticipation: ChildParticipationResult;
  managementResponse: ManagementResponseResult;
  visitTimeline: VisitTimelineEntry[];
  strengths: string[];
  areasForDevelopment: string[];
  immediateActions: string[];
  regulatoryLinks: string[];
}

// ── Labels ────────────────────────────────────────────────────────────────────

const VISIT_FOCUS_LABELS: Record<VisitFocus, string> = {
  overall_quality: "Overall Quality",
  safeguarding: "Safeguarding",
  behaviour: "Behaviour",
  education: "Education",
  health: "Health",
  environment: "Environment",
  staffing: "Staffing",
  complaints: "Complaints",
  children_views: "Children's Views",
  records: "Records",
};

const RECOMMENDATION_PRIORITY_LABELS: Record<RecommendationPriority, string> = {
  immediate: "Immediate",
  high: "High",
  medium: "Medium",
  low: "Low",
};

const RECOMMENDATION_STATUS_LABELS: Record<RecommendationStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  completed: "Completed",
  overdue: "Overdue",
  rejected: "Rejected",
};

export function getVisitFocusLabel(f: VisitFocus): string {
  return VISIT_FOCUS_LABELS[f] ?? f.replace(/_/g, " ");
}

export function getRecommendationPriorityLabel(p: RecommendationPriority): string {
  return RECOMMENDATION_PRIORITY_LABELS[p] ?? p.replace(/_/g, " ");
}

export function getRecommendationStatusLabel(s: RecommendationStatus): string {
  return RECOMMENDATION_STATUS_LABELS[s] ?? s.replace(/_/g, " ");
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysBetween(a: string, b: string): number {
  return Math.floor(
    (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000,
  );
}

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function inPeriod(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}

function getExpectedMonths(periodStart: string, periodEnd: string): string[] {
  const startDate = new Date(periodStart);
  const endDate = new Date(periodEnd);
  const months: string[] = [];
  const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  while (current <= endDate) {
    months.push(
      `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`,
    );
    current.setMonth(current.getMonth() + 1);
  }
  return months;
}

function visitMonth(visitDate: string): string {
  const d = new Date(visitDate);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ── Core Function 1: Visit Compliance ─────────────────────────────────────────

/**
 * Evaluates monthly Reg 44 visit compliance: frequency, independence,
 * thoroughness, report timeliness, and Ofsted sharing.
 */
export function evaluateVisitCompliance(
  visits: Reg44Visit[],
  periodStart: string,
  periodEnd: string,
): VisitComplianceResult {
  const expectedMonths = getExpectedMonths(periodStart, periodEnd);
  const totalVisitsExpected = expectedMonths.length;

  // Filter visits within the period
  const periodVisits = visits.filter((v) =>
    inPeriod(v.visitDate, periodStart, periodEnd),
  );
  const totalVisitsCompleted = periodVisits.length;
  const visitCompletionRate = pct(totalVisitsCompleted, totalVisitsExpected);

  // Independence
  const independentCount = periodVisits.filter(
    (v) => v.visitorIndependent,
  ).length;
  const independentVisitorRate = pct(independentCount, totalVisitsCompleted);
  const nonIndependentVisits = periodVisits
    .filter((v) => !v.visitorIndependent)
    .map((v) => v.id);

  // Children/staff engagement
  const totalChildrenSpoken = periodVisits.reduce(
    (sum, v) => sum + v.childrenSpokenTo,
    0,
  );
  const averageChildrenSpoken =
    totalVisitsCompleted === 0
      ? 0
      : Math.round((totalChildrenSpoken / totalVisitsCompleted) * 10) / 10;

  const totalStaffSpoken = periodVisits.reduce(
    (sum, v) => sum + v.staffSpokenTo,
    0,
  );
  const averageStaffSpoken =
    totalVisitsCompleted === 0
      ? 0
      : Math.round((totalStaffSpoken / totalVisitsCompleted) * 10) / 10;

  // Records/environment
  const recordsReviewedCount = periodVisits.filter(
    (v) => v.recordsReviewed,
  ).length;
  const recordsReviewedRate = pct(recordsReviewedCount, totalVisitsCompleted);

  const environmentInspectedCount = periodVisits.filter(
    (v) => v.environmentInspected,
  ).length;
  const environmentInspectedRate = pct(
    environmentInspectedCount,
    totalVisitsCompleted,
  );

  // Report timeliness
  const onTimeCount = periodVisits.filter(
    (v) => v.reportSubmittedOnTime,
  ).length;
  const reportOnTimeRate = pct(onTimeCount, totalVisitsCompleted);

  // Ofsted sharing
  const ofstedSharedCount = periodVisits.filter(
    (v) => v.sharedWithOfsted,
  ).length;
  const ofstedSharedRate = pct(ofstedSharedCount, totalVisitsCompleted);

  // Rating breakdown
  const ratingCounts = new Map<string, number>();
  for (const v of periodVisits) {
    ratingCounts.set(
      v.overallRating,
      (ratingCounts.get(v.overallRating) ?? 0) + 1,
    );
  }
  const ratingBreakdown = Array.from(ratingCounts.entries())
    .map(([rating, count]) => ({ rating, count }))
    .sort((a, b) => b.count - a.count);

  // Focus area coverage
  const focusCounts = new Map<VisitFocus, number>();
  for (const v of periodVisits) {
    for (const area of v.focusAreas) {
      focusCounts.set(area, (focusCounts.get(area) ?? 0) + 1);
    }
  }
  const focusAreaCoverage = Array.from(focusCounts.entries())
    .map(([area, count]) => ({ area, count }))
    .sort((a, b) => b.count - a.count);

  // Missed months
  const coveredMonths = new Set(periodVisits.map((v) => visitMonth(v.visitDate)));
  const missedMonths = expectedMonths.filter((m) => !coveredMonths.has(m));

  // Longest gap between visits
  let longestGapDays = 0;
  if (periodVisits.length >= 2) {
    const sorted = [...periodVisits].sort(
      (a, b) => new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime(),
    );
    for (let i = 1; i < sorted.length; i++) {
      const gap = daysBetween(sorted[i - 1].visitDate, sorted[i].visitDate);
      if (gap > longestGapDays) longestGapDays = gap;
    }
  }

  // Concerns / positives averages
  const totalConcerns = periodVisits.reduce(
    (sum, v) => sum + v.concerns.length,
    0,
  );
  const averageConcernsPerVisit =
    totalVisitsCompleted === 0
      ? 0
      : Math.round((totalConcerns / totalVisitsCompleted) * 10) / 10;

  const totalPositiveFindings = periodVisits.reduce(
    (sum, v) => sum + v.positiveFindings.length,
    0,
  );
  const averagePositiveFindingsPerVisit =
    totalVisitsCompleted === 0
      ? 0
      : Math.round((totalPositiveFindings / totalVisitsCompleted) * 10) / 10;

  return {
    totalVisitsExpected,
    totalVisitsCompleted,
    visitCompletionRate,
    independentVisitorRate,
    nonIndependentVisits,
    averageChildrenSpoken,
    averageStaffSpoken,
    recordsReviewedRate,
    environmentInspectedRate,
    reportOnTimeRate,
    ofstedSharedRate,
    ratingBreakdown,
    focusAreaCoverage,
    missedMonths,
    longestGapDays,
    averageConcernsPerVisit,
    averagePositiveFindingsPerVisit,
  };
}

// ── Core Function 2: Recommendations ──────────────────────────────────────────

/**
 * Evaluates recommendation completion rate, overdue analysis,
 * priority breakdown, average completion time, and impact assessment.
 */
export function evaluateRecommendations(
  recommendations: Reg44Recommendation[],
  referenceDate: string,
): RecommendationResult {
  const totalRecommendations = recommendations.length;

  // Determine effective status: mark overdue if target date passed and not completed/rejected
  const withEffectiveStatus = recommendations.map((r) => {
    if (
      r.status !== "completed" &&
      r.status !== "rejected" &&
      r.targetDate < referenceDate
    ) {
      return { ...r, effectiveStatus: "overdue" as RecommendationStatus };
    }
    return { ...r, effectiveStatus: r.status };
  });

  const completedCount = withEffectiveStatus.filter(
    (r) => r.effectiveStatus === "completed",
  ).length;
  const completionRate = pct(completedCount, totalRecommendations);

  const openCount = withEffectiveStatus.filter(
    (r) => r.effectiveStatus === "open",
  ).length;
  const inProgressCount = withEffectiveStatus.filter(
    (r) => r.effectiveStatus === "in_progress",
  ).length;
  const overdueCount = withEffectiveStatus.filter(
    (r) => r.effectiveStatus === "overdue",
  ).length;
  const rejectedCount = withEffectiveStatus.filter(
    (r) => r.effectiveStatus === "rejected",
  ).length;
  const overdueRate = pct(overdueCount, totalRecommendations);

  // Priority breakdown
  const priorities: RecommendationPriority[] = ["immediate", "high", "medium", "low"];
  const priorityBreakdown = priorities.map((priority) => {
    const matching = withEffectiveStatus.filter((r) => r.priority === priority);
    return {
      priority,
      count: matching.length,
      completedCount: matching.filter((r) => r.effectiveStatus === "completed").length,
    };
  }).filter((p) => p.count > 0);

  // Average completion time (days from visit to completedDate)
  const completedRecs = recommendations.filter(
    (r) => r.status === "completed" && r.completedDate,
  );
  let averageCompletionDays = 0;
  if (completedRecs.length > 0) {
    const totalDays = completedRecs.reduce((sum, r) => {
      return sum + daysBetween(r.targetDate, r.completedDate!);
    }, 0);
    // Use absolute days from target to completion (negative means early)
    const totalAbsDays = completedRecs.reduce((sum, r) => {
      const days = daysBetween(r.targetDate, r.completedDate!);
      return sum + Math.abs(days);
    }, 0);
    averageCompletionDays =
      Math.round((totalAbsDays / completedRecs.length) * 10) / 10;
  }

  // Impact assessed rate (of completed)
  const impactAssessedCount = completedRecs.filter(
    (r) => r.impactAssessed,
  ).length;
  const impactAssessedRate = pct(impactAssessedCount, completedRecs.length);

  // Evidence rate (of completed)
  const withEvidenceCount = completedRecs.filter(
    (r) => r.evidenceOfCompletion && r.evidenceOfCompletion.length > 0,
  ).length;
  const withEvidenceRate = pct(withEvidenceCount, completedRecs.length);

  // Overdue recommendations detail
  const overdueRecommendations = withEffectiveStatus
    .filter((r) => r.effectiveStatus === "overdue")
    .map((r) => ({
      id: r.id,
      description: r.description,
      priority: r.priority,
      targetDate: r.targetDate,
    }));

  return {
    totalRecommendations,
    completedCount,
    completionRate,
    openCount,
    inProgressCount,
    overdueCount,
    rejectedCount,
    overdueRate,
    priorityBreakdown,
    averageCompletionDays,
    impactAssessedRate,
    withEvidenceRate,
    overdueRecommendations,
  };
}

// ── Core Function 3: Child Participation ──────────────────────────────────────

/**
 * Evaluates children spoken to rate, views captured,
 * issues raised and actioned, and per-child coverage.
 */
export function evaluateChildParticipation(
  participation: ChildParticipation[],
  childIds: string[],
): ChildParticipationResult {
  const totalRecords = participation.length;

  // Spoken to rate
  const spokenToCount = participation.filter((p) => p.spokenTo).length;
  const childrenSpokenToRate = pct(spokenToCount, totalRecords);

  // Views captured rate
  const viewsCapturedCount = participation.filter(
    (p) => p.viewsCaptured,
  ).length;
  const viewsCapturedRate = pct(viewsCapturedCount, totalRecords);

  // Positive feedback rate (of those who provided views)
  const withViews = participation.filter((p) => p.viewsCaptured);
  const positiveFeedbackCount = withViews.filter(
    (p) => p.feedbackPositive,
  ).length;
  const positiveFeedbackRate = pct(positiveFeedbackCount, withViews.length);

  // Issues
  const totalIssuesRaised = participation.reduce(
    (sum, p) => sum + p.issuesRaised.length,
    0,
  );
  const withIssues = participation.filter(
    (p) => p.issuesRaised.length > 0,
  );
  const actionedCount = withIssues.filter((p) => p.issuesActioned).length;
  const issuesActionedRate = pct(actionedCount, withIssues.length);

  // Per-child coverage
  const childMap = new Map<
    string,
    { childName: string; spokenTo: number; totalVisits: number }
  >();
  for (const p of participation) {
    const existing = childMap.get(p.childId) ?? {
      childName: p.childName,
      spokenTo: 0,
      totalVisits: 0,
    };
    childMap.set(p.childId, {
      childName: p.childName,
      spokenTo: existing.spokenTo + (p.spokenTo ? 1 : 0),
      totalVisits: existing.totalVisits + 1,
    });
  }

  const childCoverageBreakdown = Array.from(childMap.entries()).map(
    ([childId, data]) => ({
      childId,
      childName: data.childName,
      timesSpokenTo: data.spokenTo,
      totalVisits: data.totalVisits,
    }),
  );

  // Children who were never spoken to
  const spokenChildIds = new Set(
    participation.filter((p) => p.spokenTo).map((p) => p.childId),
  );
  const unheardChildren = childIds
    .filter((id) => !spokenChildIds.has(id))
    .map((id) => {
      const record = participation.find((p) => p.childId === id);
      return { childId: id, childName: record?.childName ?? id };
    });

  // Child coverage: proportion of registered children spoken to at least once
  const childCoverage = pct(spokenChildIds.size, childIds.length);

  return {
    totalRecords,
    childrenSpokenToRate,
    viewsCapturedRate,
    positiveFeedbackRate,
    totalIssuesRaised,
    issuesActionedRate,
    childCoverage,
    childCoverageBreakdown,
    unheardChildren,
  };
}

// ── Core Function 4: Management Response ──────────────────────────────────────

/**
 * Evaluates management response to Reg 44 visit reports:
 * timeliness, acceptance rate, action plan creation, RI sharing.
 */
export function evaluateManagementResponse(
  responses: ManagementResponse[],
  visitIds: string[],
): ManagementResponseResult {
  const totalResponses = responses.length;

  // Timeliness
  const onTimeCount = responses.filter((r) => r.respondedOnTime).length;
  const respondedOnTimeRate = pct(onTimeCount, totalResponses);

  // Acceptance/rejection rates
  const totalAccepted = responses.reduce(
    (sum, r) => sum + r.acceptedRecommendations,
    0,
  );
  const totalRejected = responses.reduce(
    (sum, r) => sum + r.rejectedRecommendations,
    0,
  );
  const totalDecisions = totalAccepted + totalRejected;
  const averageAcceptanceRate = pct(totalAccepted, totalDecisions);
  const averageRejectionRate = pct(totalRejected, totalDecisions);

  // Action plans
  const actionPlanCount = responses.filter(
    (r) => r.actionPlanCreated,
  ).length;
  const actionPlanCreatedRate = pct(actionPlanCount, totalResponses);

  // RI sharing
  const sharedWithRICount = responses.filter(
    (r) => r.sharedWithRI,
  ).length;
  const sharedWithRIRate = pct(sharedWithRICount, totalResponses);

  // All rejection reasons
  const totalRejectionReasons = responses.flatMap(
    (r) => r.rejectionReasons,
  );

  // Visits without a management response
  const respondedVisitIds = new Set(responses.map((r) => r.visitId));
  const visitsMissingResponse = visitIds.filter(
    (id) => !respondedVisitIds.has(id),
  );

  return {
    totalResponses,
    respondedOnTimeRate,
    averageAcceptanceRate,
    averageRejectionRate,
    actionPlanCreatedRate,
    sharedWithRIRate,
    totalRejectionReasons,
    visitsMissingResponse,
  };
}

// ── Core Function 5: Visit Timeline ───────────────────────────────────────────

/**
 * Builds a chronological view of visits with linked recommendations,
 * child participation, and management responses.
 */
export function buildVisitTimeline(
  visits: Reg44Visit[],
  recommendations: Reg44Recommendation[],
  participation: ChildParticipation[],
  responses: ManagementResponse[],
): VisitTimelineEntry[] {
  const sorted = [...visits].sort(
    (a, b) => new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime(),
  );

  return sorted.map((visit) => {
    const visitRecs = recommendations.filter(
      (r) => r.visitId === visit.id,
    );
    const visitPart = participation.filter(
      (p) => p.visitId === visit.id,
    );
    const visitResp = responses.find((r) => r.visitId === visit.id);

    return {
      visitId: visit.id,
      visitDate: visit.visitDate,
      visitor: visit.visitor,
      overallRating: visit.overallRating,
      recommendationCount: visitRecs.length,
      completedRecommendations: visitRecs.filter(
        (r) => r.status === "completed",
      ).length,
      childrenParticipated: visitPart.filter((p) => p.spokenTo).length,
      totalChildren: visit.totalChildren,
      hasManagementResponse: !!visitResp,
      respondedOnTime: visitResp?.respondedOnTime ?? false,
      concerns: visit.concerns,
      positiveFindings: visit.positiveFindings,
    };
  });
}

// ── Core Function 6: Main Intelligence ────────────────────────────────────────

/**
 * Generates comprehensive Reg 44 compliance intelligence combining
 * visit compliance, recommendations, child participation, and management response.
 */
export function generateReg44ComplianceIntelligence(
  visits: Reg44Visit[],
  recommendations: Reg44Recommendation[],
  participation: ChildParticipation[],
  responses: ManagementResponse[],
  childIds: string[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
  referenceDate: string,
): Reg44ComplianceIntelligenceResult {
  const visitCompliance = evaluateVisitCompliance(visits, periodStart, periodEnd);
  const recommendationResult = evaluateRecommendations(
    recommendations,
    referenceDate,
  );
  const childParticipation = evaluateChildParticipation(
    participation,
    childIds,
  );

  const periodVisitIds = visits
    .filter((v) => inPeriod(v.visitDate, periodStart, periodEnd))
    .map((v) => v.id);
  const managementResponseResult = evaluateManagementResponse(
    responses,
    periodVisitIds,
  );

  const visitTimeline = buildVisitTimeline(
    visits.filter((v) => inPeriod(v.visitDate, periodStart, periodEnd)),
    recommendations,
    participation,
    responses,
  );

  // ── Scoring ──────────────────────────────────────────────────────────────

  // 1. Visit compliance (30 points)
  let visitScore = 0;

  // Monthly frequency (10 pts)
  if (visitCompliance.visitCompletionRate === 100) visitScore += 10;
  else if (visitCompliance.visitCompletionRate >= 80) visitScore += 7;
  else if (visitCompliance.visitCompletionRate >= 60) visitScore += 4;
  else if (visitCompliance.visitCompletionRate >= 40) visitScore += 2;

  // Independence (6 pts)
  if (visitCompliance.independentVisitorRate === 100) visitScore += 6;
  else if (visitCompliance.independentVisitorRate >= 80) visitScore += 4;
  else if (visitCompliance.independentVisitorRate >= 50) visitScore += 2;

  // Quality — ratings (6 pts)
  const outstandingOrGood = visitCompliance.ratingBreakdown
    .filter((r) => r.rating === "outstanding" || r.rating === "good")
    .reduce((sum, r) => sum + r.count, 0);
  const qualityRate = pct(outstandingOrGood, visitCompliance.totalVisitsCompleted);
  if (qualityRate === 100) visitScore += 6;
  else if (qualityRate >= 80) visitScore += 4;
  else if (qualityRate >= 60) visitScore += 2;

  // Report timeliness (4 pts)
  if (visitCompliance.reportOnTimeRate === 100) visitScore += 4;
  else if (visitCompliance.reportOnTimeRate >= 80) visitScore += 2;
  else if (visitCompliance.reportOnTimeRate >= 60) visitScore += 1;

  // Ofsted sharing (4 pts)
  if (visitCompliance.ofstedSharedRate === 100) visitScore += 4;
  else if (visitCompliance.ofstedSharedRate >= 80) visitScore += 2;
  else if (visitCompliance.ofstedSharedRate >= 50) visitScore += 1;

  visitScore = Math.min(visitScore, 30);

  // 2. Recommendations (25 points)
  let recScore = 0;

  // Completion rate (10 pts)
  if (recommendationResult.completionRate >= 90) recScore += 10;
  else if (recommendationResult.completionRate >= 75) recScore += 7;
  else if (recommendationResult.completionRate >= 50) recScore += 4;
  else if (recommendationResult.completionRate >= 25) recScore += 2;

  // Overdue (5 pts — penalty for overdue)
  if (recommendationResult.overdueCount === 0) recScore += 5;
  else if (recommendationResult.overdueRate <= 10) recScore += 3;
  else if (recommendationResult.overdueRate <= 25) recScore += 1;

  // Immediate priority overdue: extra penalty
  const immediateOverdue = recommendationResult.overdueRecommendations.filter(
    (r) => r.priority === "immediate",
  ).length;
  if (immediateOverdue > 0) recScore -= Math.min(immediateOverdue * 2, 5);

  // Impact assessed (5 pts)
  if (recommendationResult.impactAssessedRate >= 80) recScore += 5;
  else if (recommendationResult.impactAssessedRate >= 60) recScore += 3;
  else if (recommendationResult.impactAssessedRate >= 40) recScore += 1;

  // Evidence provided (5 pts)
  if (recommendationResult.withEvidenceRate >= 80) recScore += 5;
  else if (recommendationResult.withEvidenceRate >= 60) recScore += 3;
  else if (recommendationResult.withEvidenceRate >= 40) recScore += 1;

  recScore = Math.max(0, Math.min(recScore, 25));

  // 3. Child participation (25 points)
  let childScore = 0;

  // Coverage: all children spoken to at least once (8 pts)
  if (childParticipation.childCoverage === 100) childScore += 8;
  else if (childParticipation.childCoverage >= 80) childScore += 5;
  else if (childParticipation.childCoverage >= 60) childScore += 3;
  else if (childParticipation.childCoverage >= 40) childScore += 1;

  // Spoken-to rate per visit (6 pts)
  if (childParticipation.childrenSpokenToRate >= 90) childScore += 6;
  else if (childParticipation.childrenSpokenToRate >= 75) childScore += 4;
  else if (childParticipation.childrenSpokenToRate >= 50) childScore += 2;

  // Views captured (5 pts)
  if (childParticipation.viewsCapturedRate >= 90) childScore += 5;
  else if (childParticipation.viewsCapturedRate >= 75) childScore += 3;
  else if (childParticipation.viewsCapturedRate >= 50) childScore += 1;

  // Issues actioned (6 pts)
  if (childParticipation.totalIssuesRaised === 0) {
    childScore += 6; // No issues = full marks
  } else {
    if (childParticipation.issuesActionedRate === 100) childScore += 6;
    else if (childParticipation.issuesActionedRate >= 80) childScore += 4;
    else if (childParticipation.issuesActionedRate >= 50) childScore += 2;
  }

  childScore = Math.min(childScore, 25);

  // 4. Management response (20 points)
  let mgmtScore = 0;

  // Timeliness (6 pts)
  if (managementResponseResult.respondedOnTimeRate === 100) mgmtScore += 6;
  else if (managementResponseResult.respondedOnTimeRate >= 80) mgmtScore += 4;
  else if (managementResponseResult.respondedOnTimeRate >= 60) mgmtScore += 2;

  // Acceptance rate (4 pts)
  if (managementResponseResult.averageAcceptanceRate >= 90) mgmtScore += 4;
  else if (managementResponseResult.averageAcceptanceRate >= 75) mgmtScore += 2;
  else if (managementResponseResult.averageAcceptanceRate >= 50) mgmtScore += 1;

  // Action plans created (4 pts)
  if (managementResponseResult.actionPlanCreatedRate === 100) mgmtScore += 4;
  else if (managementResponseResult.actionPlanCreatedRate >= 80) mgmtScore += 2;
  else if (managementResponseResult.actionPlanCreatedRate >= 50) mgmtScore += 1;

  // Shared with RI (4 pts)
  if (managementResponseResult.sharedWithRIRate === 100) mgmtScore += 4;
  else if (managementResponseResult.sharedWithRIRate >= 80) mgmtScore += 2;
  else if (managementResponseResult.sharedWithRIRate >= 50) mgmtScore += 1;

  // Penalty for missing responses (2 pts penalty)
  if (managementResponseResult.visitsMissingResponse.length > 0) {
    mgmtScore -= Math.min(
      managementResponseResult.visitsMissingResponse.length * 2,
      4,
    );
  } else {
    mgmtScore += 2;
  }

  mgmtScore = Math.max(0, Math.min(mgmtScore, 20));

  // ── Overall ──────────────────────────────────────────────────────────────

  const overallScore = Math.min(
    100,
    Math.max(0, visitScore + recScore + childScore + mgmtScore),
  );

  const rating: Reg44ComplianceIntelligenceResult["rating"] =
    overallScore >= 80
      ? "outstanding"
      : overallScore >= 60
        ? "good"
        : overallScore >= 40
          ? "requires_improvement"
          : "inadequate";

  // ── Strengths / Areas / Actions ─────────────────────────────────────────

  const strengths: string[] = [];
  const areasForDevelopment: string[] = [];
  const immediateActions: string[] = [];

  // Strengths
  if (visitCompliance.visitCompletionRate === 100) {
    strengths.push("All monthly Reg 44 independent visits completed on schedule");
  }
  if (visitCompliance.independentVisitorRate === 100 && visitCompliance.totalVisitsCompleted > 0) {
    strengths.push("All visits conducted by independent persons as required by Reg 44");
  }
  if (visitCompliance.reportOnTimeRate === 100 && visitCompliance.totalVisitsCompleted > 0) {
    strengths.push("All visit reports submitted within required timescales");
  }
  if (visitCompliance.ofstedSharedRate === 100 && visitCompliance.totalVisitsCompleted > 0) {
    strengths.push("All visit reports shared with Ofsted as required");
  }
  if (recommendationResult.completionRate >= 80) {
    strengths.push(
      `Strong recommendation completion rate of ${recommendationResult.completionRate}%`,
    );
  }
  if (childParticipation.childCoverage === 100) {
    strengths.push("All children spoken to during Reg 44 visits — excellent voice of the child");
  }
  if (
    childParticipation.totalIssuesRaised > 0 &&
    childParticipation.issuesActionedRate === 100
  ) {
    strengths.push("All issues raised by children have been actioned");
  }
  if (managementResponseResult.respondedOnTimeRate === 100 && managementResponseResult.totalResponses > 0) {
    strengths.push("Management responds to all Reg 44 reports within required timescales");
  }
  if (managementResponseResult.actionPlanCreatedRate === 100 && managementResponseResult.totalResponses > 0) {
    strengths.push("Action plans created for every Reg 44 visit report");
  }
  if (strengths.length === 0) {
    strengths.push("No significant strengths identified — Reg 44 compliance needs attention");
  }

  // Areas for development
  if (visitCompliance.missedMonths.length > 0) {
    areasForDevelopment.push(
      `${visitCompliance.missedMonths.length} month${visitCompliance.missedMonths.length !== 1 ? "s" : ""} without a Reg 44 visit: ${visitCompliance.missedMonths.join(", ")}`,
    );
  }
  if (visitCompliance.nonIndependentVisits.length > 0) {
    areasForDevelopment.push(
      `${visitCompliance.nonIndependentVisits.length} visit${visitCompliance.nonIndependentVisits.length !== 1 ? "s" : ""} conducted by non-independent persons`,
    );
  }
  if (recommendationResult.overdueCount > 0) {
    areasForDevelopment.push(
      `${recommendationResult.overdueCount} recommendation${recommendationResult.overdueCount !== 1 ? "s" : ""} overdue for completion`,
    );
  }
  if (childParticipation.unheardChildren.length > 0) {
    areasForDevelopment.push(
      `${childParticipation.unheardChildren.length} child${childParticipation.unheardChildren.length !== 1 ? "ren" : ""} not spoken to during any visit`,
    );
  }
  if (managementResponseResult.visitsMissingResponse.length > 0) {
    areasForDevelopment.push(
      `${managementResponseResult.visitsMissingResponse.length} visit${managementResponseResult.visitsMissingResponse.length !== 1 ? "s" : ""} without a management response`,
    );
  }
  if (recommendationResult.impactAssessedRate < 80 && recommendationResult.completedCount > 0) {
    areasForDevelopment.push(
      `Impact assessment completed for only ${recommendationResult.impactAssessedRate}% of completed recommendations`,
    );
  }
  if (visitCompliance.reportOnTimeRate < 100 && visitCompliance.totalVisitsCompleted > 0) {
    areasForDevelopment.push(
      `Report submission on-time rate is ${visitCompliance.reportOnTimeRate}% (target: 100%)`,
    );
  }
  if (areasForDevelopment.length === 0) {
    areasForDevelopment.push("No significant areas for development identified");
  }

  // Immediate actions
  if (visitCompliance.missedMonths.length > 0) {
    immediateActions.push(
      `URGENT: Arrange Reg 44 visit for missed month${visitCompliance.missedMonths.length !== 1 ? "s" : ""}: ${visitCompliance.missedMonths.join(", ")}`,
    );
  }
  if (visitCompliance.nonIndependentVisits.length > 0) {
    immediateActions.push(
      "URGENT: Ensure all future visits are conducted by persons independent of the provider — Reg 44 requirement",
    );
  }
  if (immediateOverdue > 0) {
    immediateActions.push(
      `URGENT: ${immediateOverdue} immediate-priority recommendation${immediateOverdue !== 1 ? "s" : ""} overdue — address without delay`,
    );
  }
  if (recommendationResult.overdueCount > immediateOverdue) {
    const otherOverdue = recommendationResult.overdueCount - immediateOverdue;
    immediateActions.push(
      `HIGH: ${otherOverdue} recommendation${otherOverdue !== 1 ? "s" : ""} overdue for completion`,
    );
  }
  if (managementResponseResult.visitsMissingResponse.length > 0) {
    immediateActions.push(
      `HIGH: Complete management response for ${managementResponseResult.visitsMissingResponse.length} visit${managementResponseResult.visitsMissingResponse.length !== 1 ? "s" : ""}`,
    );
  }
  if (childParticipation.unheardChildren.length > 0) {
    immediateActions.push(
      `MEDIUM: Ensure ${childParticipation.unheardChildren.map((c) => c.childName).join(", ")} ${childParticipation.unheardChildren.length !== 1 ? "are" : "is"} spoken to during next visit`,
    );
  }
  if (
    childParticipation.totalIssuesRaised > 0 &&
    childParticipation.issuesActionedRate < 100
  ) {
    immediateActions.push(
      "MEDIUM: Action outstanding issues raised by children during Reg 44 visits",
    );
  }
  if (managementResponseResult.sharedWithRIRate < 100 && managementResponseResult.totalResponses > 0) {
    immediateActions.push(
      "MEDIUM: Ensure all management responses and action plans are shared with the Responsible Individual",
    );
  }
  if (immediateActions.length === 0) {
    immediateActions.push(
      "No immediate actions required — Reg 44 compliance framework is robust",
    );
  }

  // Regulatory links
  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 44 — Independent person: visits (monthly, by independent person)",
    "CHR 2015 Reg 44(2) — Visitor must interview children and inspect premises",
    "CHR 2015 Reg 44(4) — Report produced after each visit",
    "CHR 2015 Reg 45 — Review of quality of care (Reg 45 monthly monitoring)",
    "SCCIF — Leadership & management: quality assurance and governance",
    "NMS 25 — Monitoring by independent person",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    referenceDate,
    overallScore,
    rating,
    visitCompliance,
    recommendations: recommendationResult,
    childParticipation,
    managementResponse: managementResponseResult,
    visitTimeline,
    strengths,
    areasForDevelopment,
    immediateActions,
    regulatoryLinks,
  };
}
