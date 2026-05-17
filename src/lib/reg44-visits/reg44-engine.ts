// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Reg 44/45 Independent Visits Engine
//
// Deterministic engine for tracking independent person visits (Reg 44),
// quality of visit reports, action tracking, and Ofsted reporting compliance.
//
// Aligned to:
//   - CHR 2015 Reg 44 — Independent person: visits
//   - CHR 2015 Reg 45 — Independent person: reports
//   - SCCIF — Leadership: quality assurance & governance
//   - DfE Guide to Regulation 44 Visits
//
// Key requirements:
//   - Visit at least once per calendar month (no more than 28 days apart)
//   - Visitor must be independent (not employed by provider)
//   - Report produced after each visit
//   - Report sent to Ofsted within specified timeframe
//   - Report covers: welfare, safety, staffing, environment, complaints
//   - Children spoken to privately during visit
//   - Actions arising tracked and completed
//   - Report shared with registered manager
//   - Patterns and trends identified across visits
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type VisitArea =
  | "welfare_of_children"
  | "safety"
  | "staffing"
  | "environment"
  | "complaints_and_concerns"
  | "education"
  | "health"
  | "contact_arrangements"
  | "records_and_documentation"
  | "leadership_and_management";

export type VisitRating = "good" | "adequate" | "requires_improvement" | "inadequate";

export type ActionPriority = "immediate" | "high" | "medium" | "low";

export type ActionStatus = "open" | "in_progress" | "completed" | "overdue";

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface Reg44Visit {
  id: string;
  homeId: string;
  visitDate: string;
  visitorName: string;
  visitorIndependent: boolean;
  visitDuration: number;                   // minutes
  // Children engagement
  childrenSpokenTo: string[];
  childrenSpokenToPrivately: string[];
  totalChildrenInHome: number;
  // Areas assessed
  areasAssessed: VisitAreaAssessment[];
  // Report
  reportCompletedDate?: string;
  reportSentToOfstedDate?: string;
  reportSentToManagerDate?: string;
  reportSentToRIDate?: string;
  // Overall
  overallRating: VisitRating;
  keyFindings: string[];
  positiveObservations: string[];
  areasForImprovement: string[];
  // Actions
  actionsRaised: Reg44Action[];
  // Previous actions followed up
  previousActionsReviewed: boolean;
}

export interface VisitAreaAssessment {
  area: VisitArea;
  rating: VisitRating;
  observations: string;
  evidenceReviewed: string[];
}

export interface Reg44Action {
  id: string;
  visitId: string;
  description: string;
  priority: ActionPriority;
  assignedTo: string;
  dueDate: string;
  status: ActionStatus;
  completedDate?: string;
  evidence?: string;
}

export interface HomeReg44Profile {
  homeId: string;
  visits: Reg44Visit[];
  currentVisitorName: string;
  visitorAppointedDate: string;
  visitorDBSDate: string;
  visitorTrainingDate?: string;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface VisitComplianceResult {
  visitId: string;
  isCompliant: boolean;
  issues: string[];
  warnings: string[];
  // Checks
  visitorIndependent: boolean;
  childrenEngagementRate: number;         // % spoken to privately
  allAreasAssessed: boolean;
  reportCompleted: boolean;
  reportSentToOfsted: boolean;
  reportTimely: boolean;                  // within 5 working days
  previousActionsReviewed: boolean;
  overallRating: VisitRating;
}

export interface HomeReg44Metrics {
  homeId: string;
  // Frequency
  totalVisitsLast12Months: number;
  visitGapDays: number;                    // largest gap between visits
  frequencyCompliant: boolean;             // no gap > 28 days
  lastVisitDate: string;
  nextVisitDue: string;
  daysUntilNextDue: number;
  // Quality
  averageChildEngagement: number;          // avg % children spoken privately
  averageVisitDuration: number;
  areasNeverAssessed: VisitArea[];
  overallRatingTrend: VisitRating[];
  // Reports
  reportCompletionRate: number;
  ofstedSubmissionRate: number;
  reportTimelinessRate: number;
  // Actions
  totalActionsRaised: number;
  actionsCompleted: number;
  actionsOverdue: number;
  actionCompletionRate: number;
  // Patterns
  recurringIssueAreas: VisitArea[];
  improvementTrend: "improving" | "stable" | "declining" | "insufficient_data";
  complianceIssues: string[];
}

// ── Configuration ──────────────────────────────────────────────────────────

const MAX_DAYS_BETWEEN_VISITS = 28;
const REPORT_DEADLINE_DAYS = 5;            // 5 working days after visit
const ALL_VISIT_AREAS: VisitArea[] = [
  "welfare_of_children",
  "safety",
  "staffing",
  "environment",
  "complaints_and_concerns",
  "education",
  "health",
  "contact_arrangements",
  "records_and_documentation",
  "leadership_and_management",
];

// ── Core: Evaluate Single Visit Compliance ──────────────────────────────

export function evaluateVisitCompliance(
  visit: Reg44Visit,
  now?: string,
): VisitComplianceResult {
  const issues: string[] = [];
  const warnings: string[] = [];

  // Independence
  if (!visit.visitorIndependent) {
    issues.push("Visitor is not independent of the provider");
  }

  // Children engagement
  const childrenEngagementRate = visit.totalChildrenInHome > 0
    ? Math.round((visit.childrenSpokenToPrivately.length / visit.totalChildrenInHome) * 100)
    : 0;

  if (visit.childrenSpokenToPrivately.length === 0) {
    issues.push("No children spoken to privately during visit");
  } else if (childrenEngagementRate < 50) {
    warnings.push(`Only ${childrenEngagementRate}% of children spoken to privately`);
  }

  // Areas assessed
  const assessedAreas = visit.areasAssessed.map(a => a.area);
  const missingAreas = ALL_VISIT_AREAS.filter(a => !assessedAreas.includes(a));
  const allAreasAssessed = missingAreas.length === 0;

  if (missingAreas.length > 3) {
    issues.push(`${missingAreas.length} key areas not assessed during visit`);
  } else if (missingAreas.length > 0) {
    warnings.push(`Areas not covered: ${missingAreas.slice(0, 3).join(", ")}`);
  }

  // Report
  const reportCompleted = !!visit.reportCompletedDate;
  if (!reportCompleted) {
    issues.push("Visit report not completed");
  }

  const reportSentToOfsted = !!visit.reportSentToOfstedDate;
  if (!reportSentToOfsted && reportCompleted) {
    issues.push("Report not sent to Ofsted");
  }

  // Timeliness (5 working days ≈ 7 calendar days)
  let reportTimely = false;
  if (visit.reportCompletedDate) {
    const visitTime = new Date(visit.visitDate).getTime();
    const reportTime = new Date(visit.reportCompletedDate).getTime();
    const daysDiff = (reportTime - visitTime) / (24 * 60 * 60 * 1000);
    reportTimely = daysDiff <= 7;
    if (!reportTimely) {
      warnings.push(`Report completed ${Math.round(daysDiff)} days after visit (target: 5 working days)`);
    }
  }

  // Previous actions
  if (!visit.previousActionsReviewed) {
    warnings.push("Previous visit actions not reviewed during this visit");
  }

  // Duration
  if (visit.visitDuration < 120) {
    warnings.push(`Visit duration short (${visit.visitDuration} mins — expected 2+ hours)`);
  }

  return {
    visitId: visit.id,
    isCompliant: issues.length === 0,
    issues,
    warnings,
    visitorIndependent: visit.visitorIndependent,
    childrenEngagementRate,
    allAreasAssessed,
    reportCompleted,
    reportSentToOfsted,
    reportTimely,
    previousActionsReviewed: visit.previousActionsReviewed,
    overallRating: visit.overallRating,
  };
}

// ── Core: Calculate Home Reg 44 Metrics ─────────────────────────────────

export function calculateHomeReg44Metrics(
  profile: HomeReg44Profile,
  now?: string,
): HomeReg44Metrics {
  const currentTime = now ? new Date(now).getTime() : Date.now();
  const oneYearAgo = currentTime - 365 * 24 * 60 * 60 * 1000;

  const recentVisits = profile.visits
    .filter(v => new Date(v.visitDate).getTime() > oneYearAgo)
    .sort((a, b) => new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime());

  const totalVisitsLast12Months = recentVisits.length;

  // Frequency compliance — check gaps
  let visitGapDays = 0;
  let frequencyCompliant = true;

  if (recentVisits.length >= 2) {
    for (let i = 1; i < recentVisits.length; i++) {
      const gap = (new Date(recentVisits[i].visitDate).getTime() - new Date(recentVisits[i - 1].visitDate).getTime()) / (24 * 60 * 60 * 1000);
      if (gap > visitGapDays) visitGapDays = Math.round(gap);
    }
    // Also check gap from last visit to now
    if (recentVisits.length > 0) {
      const gapToNow = (currentTime - new Date(recentVisits[recentVisits.length - 1].visitDate).getTime()) / (24 * 60 * 60 * 1000);
      if (gapToNow > visitGapDays) visitGapDays = Math.round(gapToNow);
    }
    frequencyCompliant = visitGapDays <= MAX_DAYS_BETWEEN_VISITS;
  } else if (recentVisits.length === 1) {
    const gapToNow = (currentTime - new Date(recentVisits[0].visitDate).getTime()) / (24 * 60 * 60 * 1000);
    visitGapDays = Math.round(gapToNow);
    frequencyCompliant = visitGapDays <= MAX_DAYS_BETWEEN_VISITS;
  } else {
    frequencyCompliant = false;
    visitGapDays = 365;
  }

  // Last visit and next due
  const lastVisitDate = recentVisits.length > 0
    ? recentVisits[recentVisits.length - 1].visitDate
    : "";
  const lastVisitTime = lastVisitDate ? new Date(lastVisitDate).getTime() : 0;
  const nextDueTime = lastVisitTime + MAX_DAYS_BETWEEN_VISITS * 24 * 60 * 60 * 1000;
  const nextVisitDue = lastVisitTime ? new Date(nextDueTime).toISOString() : "";
  const daysUntilNextDue = lastVisitTime
    ? Math.round((nextDueTime - currentTime) / (24 * 60 * 60 * 1000))
    : -999;

  // Quality metrics
  const results = recentVisits.map(v => evaluateVisitCompliance(v, now));

  const averageChildEngagement = results.length > 0
    ? Math.round(results.reduce((s, r) => s + r.childrenEngagementRate, 0) / results.length)
    : 0;

  const averageVisitDuration = recentVisits.length > 0
    ? Math.round(recentVisits.reduce((s, v) => s + v.visitDuration, 0) / recentVisits.length)
    : 0;

  // Areas never assessed in last 12 months
  const allAssessedAreas = new Set(recentVisits.flatMap(v => v.areasAssessed.map(a => a.area)));
  const areasNeverAssessed = ALL_VISIT_AREAS.filter(a => !allAssessedAreas.has(a));

  // Rating trend
  const overallRatingTrend = recentVisits.slice(-6).map(v => v.overallRating);

  // Reports
  const reportCompletionRate = recentVisits.length > 0
    ? Math.round((recentVisits.filter(v => v.reportCompletedDate).length / recentVisits.length) * 100)
    : 100;

  const ofstedSubmissionRate = recentVisits.length > 0
    ? Math.round((recentVisits.filter(v => v.reportSentToOfstedDate).length / recentVisits.length) * 100)
    : 100;

  const reportTimelinessRate = results.length > 0
    ? Math.round((results.filter(r => r.reportTimely).length / results.length) * 100)
    : 100;

  // Actions
  const allActions = recentVisits.flatMap(v => v.actionsRaised);
  const totalActionsRaised = allActions.length;
  const actionsCompleted = allActions.filter(a => a.status === "completed").length;
  const actionsOverdue = allActions.filter(a => a.status === "overdue").length;
  const actionCompletionRate = totalActionsRaised > 0
    ? Math.round((actionsCompleted / totalActionsRaised) * 100)
    : 100;

  // Recurring issues — areas rated "requires_improvement" or "inadequate" more than once
  const areaIssueCounts = new Map<VisitArea, number>();
  for (const visit of recentVisits) {
    for (const assessment of visit.areasAssessed) {
      if (assessment.rating === "requires_improvement" || assessment.rating === "inadequate") {
        areaIssueCounts.set(assessment.area, (areaIssueCounts.get(assessment.area) || 0) + 1);
      }
    }
  }
  const recurringIssueAreas = [...areaIssueCounts.entries()]
    .filter(([, count]) => count >= 2)
    .map(([area]) => area);

  // Improvement trend
  let improvementTrend: "improving" | "stable" | "declining" | "insufficient_data" = "insufficient_data";
  if (overallRatingTrend.length >= 4) {
    const ratingScore = (r: VisitRating) => {
      if (r === "good") return 4;
      if (r === "adequate") return 3;
      if (r === "requires_improvement") return 2;
      return 1;
    };
    const halfPoint = Math.floor(overallRatingTrend.length / 2);
    const firstHalf = overallRatingTrend.slice(0, halfPoint).reduce((s, r) => s + ratingScore(r), 0) / halfPoint;
    const secondHalf = overallRatingTrend.slice(halfPoint).reduce((s, r) => s + ratingScore(r), 0) / (overallRatingTrend.length - halfPoint);
    if (secondHalf - firstHalf > 0.3) improvementTrend = "improving";
    else if (firstHalf - secondHalf > 0.3) improvementTrend = "declining";
    else improvementTrend = "stable";
  }

  // Compliance issues
  const complianceIssues: string[] = [];
  if (!frequencyCompliant) complianceIssues.push("Visit frequency non-compliant (gap exceeds 28 days)");
  if (reportCompletionRate < 100) complianceIssues.push("Not all visit reports completed");
  if (ofstedSubmissionRate < 100) complianceIssues.push("Not all reports submitted to Ofsted");
  if (actionsOverdue > 0) complianceIssues.push(`${actionsOverdue} action(s) overdue from Reg 44 visits`);
  if (areasNeverAssessed.length > 0) complianceIssues.push(`${areasNeverAssessed.length} area(s) never assessed in 12 months`);

  return {
    homeId: profile.homeId,
    totalVisitsLast12Months,
    visitGapDays,
    frequencyCompliant,
    lastVisitDate,
    nextVisitDue,
    daysUntilNextDue,
    averageChildEngagement,
    averageVisitDuration,
    areasNeverAssessed,
    overallRatingTrend,
    reportCompletionRate,
    ofstedSubmissionRate,
    reportTimelinessRate,
    totalActionsRaised,
    actionsCompleted,
    actionsOverdue,
    actionCompletionRate,
    recurringIssueAreas,
    improvementTrend,
    complianceIssues,
  };
}

// ── Label Helpers ────────────────────────────────────────────────────────

export function getVisitAreaLabel(area: VisitArea): string {
  const labels: Record<VisitArea, string> = {
    welfare_of_children: "Welfare of Children",
    safety: "Safety",
    staffing: "Staffing",
    environment: "Environment",
    complaints_and_concerns: "Complaints & Concerns",
    education: "Education",
    health: "Health",
    contact_arrangements: "Contact Arrangements",
    records_and_documentation: "Records & Documentation",
    leadership_and_management: "Leadership & Management",
  };
  return labels[area] ?? area;
}

export function getVisitRatingLabel(rating: VisitRating): string {
  const labels: Record<VisitRating, string> = {
    good: "Good",
    adequate: "Adequate",
    requires_improvement: "Requires Improvement",
    inadequate: "Inadequate",
  };
  return labels[rating] ?? rating;
}
