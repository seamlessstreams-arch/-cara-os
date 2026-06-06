// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — LAC Review Intelligence Engine
//
// Pure deterministic engine — no AI, no external calls.
// Analyses effectiveness of Looked After Children statutory reviews:
//   • Review timeliness & scheduling compliance
//   • Child participation & voice quality
//   • Recommendation tracking & implementation
//   • IRO (Independent Reviewing Officer) effectiveness
//
// Regulatory framework:
//   Care Planning, Placement and Case Review Regs 2010 (Reg 33, 36)
//   IRO Handbook 2010
//   CHR 2015 Reg 45 (review of quality of care)
//   SCCIF (Social Care Common Inspection Framework)
//   Children Act 1989 s26 (review of cases)
//   UNCRC Art 12 (right to be heard)
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ───────────────────────────────────────────────────────────────────

export type ReviewType =
  | "initial"         // Within 20 working days of placement
  | "second"          // Within 3 months of initial
  | "subsequent"      // Every 6 months thereafter
  | "emergency"       // Called in response to a significant event
  | "disruption";     // Called due to placement breakdown/disruption

export type ReviewOutcome =
  | "care_plan_endorsed"
  | "care_plan_amended"
  | "placement_change_recommended"
  | "additional_assessment_required"
  | "escalation_to_management"
  | "no_change";

export type ParticipationMethod =
  | "attended_in_person"
  | "attended_virtually"
  | "written_views"
  | "advocate_attended"
  | "views_conveyed_by_worker"
  | "refused_to_participate"
  | "not_invited";

export type RecommendationPriority =
  | "urgent"        // Must be actioned within 7 days
  | "high"          // Must be actioned within 28 days
  | "medium"        // Must be actioned within 3 months
  | "low";          // Must be actioned within 6 months

export type RecommendationStatus =
  | "completed"
  | "in_progress"
  | "overdue"
  | "not_started"
  | "no_longer_applicable";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Interfaces ──────────────────────────────────────────────────────────────

export interface LACReview {
  id: string;
  homeId: string;
  childId: string;
  childName: string;
  reviewType: ReviewType;
  dueDate: string;              // ISO date — statutory due date
  actualDate?: string;          // ISO date — when review actually happened
  wasTimely: boolean;           // Held on or before due date
  iroName: string;
  iroIndependent: boolean;      // IRO has no other involvement with the case
  participationMethod: ParticipationMethod;
  childViewsCaptured: boolean;
  childViewsSummary?: string;
  parentInvited: boolean;
  parentAttended: boolean;
  carerAttended: boolean;
  socialWorkerAttended: boolean;
  otherProfessionals: string[];
  outcome: ReviewOutcome;
  carePlanUpdated: boolean;
  minutesDistributedWithin5Days: boolean;
  nextReviewDate?: string;
}

export interface ReviewRecommendation {
  id: string;
  homeId: string;
  reviewId: string;
  childId: string;
  childName: string;
  recommendation: string;
  responsiblePerson: string;
  priority: RecommendationPriority;
  dueDate: string;
  status: RecommendationStatus;
  completedDate?: string;
  evidenceOfCompletion?: string;
  daysOverdue?: number;         // Calculated if overdue
}

export interface IROActivity {
  id: string;
  homeId: string;
  childId: string;
  childName: string;
  iroName: string;
  activityDate: string;
  activityType: "mid_point_check" | "monitoring_visit" | "consultation" | "dispute_resolution" | "escalation";
  notes: string;
  childSpokenTo: boolean;
  issuesIdentified: string[];
  actionsRequired: string[];
}

export interface ChildReviewProfile {
  childId: string;
  childName: string;
  totalReviews: number;
  reviewsOnTime: number;
  timelinessRate: number;
  participationRate: number;          // % of reviews where child participated meaningfully
  childViewsCapturedRate: number;
  carePlanUpdatedRate: number;
  totalRecommendations: number;
  completedRecommendations: number;
  overdueRecommendations: number;
  recommendationCompletionRate: number;
  iroMidPointChecks: number;
  iroChildSpokenToRate: number;
  lastReviewDate: string | null;
  nextReviewDue: string | null;
  overallScore: number;               // 0–10
}

// ── Result Types ────────────────────────────────────────────────────────────

export interface ReviewTimelinessResult {
  totalReviews: number;
  reviewsOnTime: number;
  reviewsLate: number;
  timelinessRate: number;             // %
  averageDelayDays: number;           // For late reviews only
  initialReviewTimeliness: number;    // % of initial reviews on time
  subsequentReviewTimeliness: number; // % of subsequent reviews on time
  emergencyReviewsHeld: number;
  minutesDistributedOnTimeRate: number;
  overallScore: number;               // 0–30
}

export interface ChildParticipationResult {
  totalReviews: number;
  childAttended: number;              // in person or virtual
  writtenViews: number;
  advocateAttended: number;
  viewsConveyedByWorker: number;
  refused: number;
  notInvited: number;
  meaningfulParticipationRate: number; // % (attended + written + advocate)
  childViewsCapturedRate: number;
  parentInvitedRate: number;
  parentAttendedRate: number;
  carerAttendedRate: number;
  socialWorkerAttendedRate: number;
  overallScore: number;               // 0–25
}

export interface RecommendationTrackingResult {
  totalRecommendations: number;
  completed: number;
  inProgress: number;
  overdue: number;
  notStarted: number;
  noLongerApplicable: number;
  completionRate: number;             // %
  overdueRate: number;                // %
  urgentCompletionRate: number;       // % of urgent completed on time
  averageCompletionDays: number;
  overallScore: number;               // 0–25
}

export interface IROEffectivenessResult {
  totalIROActivities: number;
  midPointChecks: number;
  monitoringVisits: number;
  consultations: number;
  disputeResolutions: number;
  escalations: number;
  childSpokenToRate: number;          // % of activities where child was spoken to
  issuesIdentifiedCount: number;
  iroIndependenceRate: number;        // % of reviews where IRO was independent
  overallScore: number;               // 0–20
}

export interface LACReviewIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  referenceDate: string;
  overallScore: number;
  rating: Rating;
  timeliness: ReviewTimelinessResult;
  participation: ChildParticipationResult;
  recommendations: RecommendationTrackingResult;
  iroEffectiveness: IROEffectivenessResult;
  childProfiles: ChildReviewProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Constants ───────────────────────────────────────────────────────────────

const DAYS_MS = 86_400_000;

// ── Helper Functions ────────────────────────────────────────────────────────

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / DAYS_MS);
}

function isInPeriod(date: string | undefined, start: string, end: string): boolean {
  if (!date) return false;
  return date.slice(0, 10) >= start.slice(0, 10) && date.slice(0, 10) <= end.slice(0, 10);
}

function pct(num: number, den: number): number {
  if (den === 0) return 0;
  return Math.round((num / den) * 1000) / 10;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function ratingFromScore(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Label Functions ─────────────────────────────────────────────────────────

export function getReviewTypeLabel(t: ReviewType): string {
  const labels: Record<ReviewType, string> = {
    initial: "Initial Review",
    second: "Second Review",
    subsequent: "Subsequent Review",
    emergency: "Emergency Review",
    disruption: "Disruption Review",
  };
  return labels[t] || t;
}

export function getParticipationMethodLabel(m: ParticipationMethod): string {
  const labels: Record<ParticipationMethod, string> = {
    attended_in_person: "Attended in Person",
    attended_virtually: "Attended Virtually",
    written_views: "Written Views",
    advocate_attended: "Advocate Attended",
    views_conveyed_by_worker: "Views Conveyed by Worker",
    refused_to_participate: "Refused to Participate",
    not_invited: "Not Invited",
  };
  return labels[m] || m;
}

export function getRecommendationPriorityLabel(p: RecommendationPriority): string {
  const labels: Record<RecommendationPriority, string> = {
    urgent: "Urgent",
    high: "High",
    medium: "Medium",
    low: "Low",
  };
  return labels[p] || p;
}

export function getRecommendationStatusLabel(s: RecommendationStatus): string {
  const labels: Record<RecommendationStatus, string> = {
    completed: "Completed",
    in_progress: "In Progress",
    overdue: "Overdue",
    not_started: "Not Started",
    no_longer_applicable: "No Longer Applicable",
  };
  return labels[s] || s;
}

// ── Core Evaluation Functions ───────────────────────────────────────────────

/**
 * Evaluate review timeliness and scheduling compliance.
 * Statutory requirement: Initial within 20 working days, second within 3 months,
 * subsequent every 6 months. Minutes must be distributed within 5 working days.
 * Score: 0–30
 */
export function evaluateReviewTimeliness(
  reviews: LACReview[],
  periodStart: string,
  periodEnd: string,
): ReviewTimelinessResult {
  const periodReviews = reviews.filter((r) => isInPeriod(r.actualDate || r.dueDate, periodStart, periodEnd));

  if (periodReviews.length === 0) {
    return {
      totalReviews: 0, reviewsOnTime: 0, reviewsLate: 0, timelinessRate: 0,
      averageDelayDays: 0, initialReviewTimeliness: 0, subsequentReviewTimeliness: 0,
      emergencyReviewsHeld: 0, minutesDistributedOnTimeRate: 0, overallScore: 0,
    };
  }

  const onTime = periodReviews.filter((r) => r.wasTimely).length;
  const late = periodReviews.length - onTime;

  // Average delay for late reviews
  const lateReviews = periodReviews.filter((r) => !r.wasTimely && r.actualDate);
  const totalDelay = lateReviews.reduce((sum, r) => {
    return sum + Math.max(0, daysBetween(r.dueDate, r.actualDate!));
  }, 0);
  const avgDelay = lateReviews.length > 0 ? Math.round((totalDelay / lateReviews.length) * 10) / 10 : 0;

  // Initial review timeliness
  const initials = periodReviews.filter((r) => r.reviewType === "initial");
  const initialsOnTime = initials.filter((r) => r.wasTimely).length;
  const initialRate = pct(initialsOnTime, initials.length);

  // Subsequent review timeliness (includes "second" and "subsequent")
  const subsequents = periodReviews.filter((r) => r.reviewType === "second" || r.reviewType === "subsequent");
  const subsequentsOnTime = subsequents.filter((r) => r.wasTimely).length;
  const subsequentRate = pct(subsequentsOnTime, subsequents.length);

  // Emergency reviews
  const emergencyCount = periodReviews.filter((r) => r.reviewType === "emergency" || r.reviewType === "disruption").length;

  // Minutes distribution
  const minutesOnTime = periodReviews.filter((r) => r.minutesDistributedWithin5Days).length;
  const minutesRate = pct(minutesOnTime, periodReviews.length);

  // Scoring — 30 points max
  const timelinessRate = pct(onTime, periodReviews.length);
  let score = 0;

  // Timeliness rate: up to 18 points
  score += (timelinessRate / 100) * 18;

  // Minutes distribution: up to 6 points
  score += (minutesRate / 100) * 6;

  // Initial review timeliness bonus: up to 3 points (critical statutory requirement)
  if (initials.length > 0) {
    score += (initialRate / 100) * 3;
  } else {
    // No initial reviews in period — redistribute to timeliness
    score += (timelinessRate / 100) * 3;
  }

  // Low average delay bonus: up to 3 points
  if (lateReviews.length === 0) {
    score += 3;
  } else if (avgDelay <= 3) {
    score += 2;
  } else if (avgDelay <= 7) {
    score += 1;
  }

  return {
    totalReviews: periodReviews.length,
    reviewsOnTime: onTime,
    reviewsLate: late,
    timelinessRate,
    averageDelayDays: avgDelay,
    initialReviewTimeliness: initialRate,
    subsequentReviewTimeliness: subsequentRate,
    emergencyReviewsHeld: emergencyCount,
    minutesDistributedOnTimeRate: minutesRate,
    overallScore: Math.round(clamp(score, 0, 30) * 10) / 10,
  };
}

/**
 * Evaluate child participation in reviews.
 * Statutory requirement: Children must be supported to participate in their reviews
 * and have their views heard. Not being invited is a serious concern.
 * Score: 0–25
 */
export function evaluateChildParticipation(
  reviews: LACReview[],
  periodStart: string,
  periodEnd: string,
): ChildParticipationResult {
  const periodReviews = reviews.filter((r) => isInPeriod(r.actualDate || r.dueDate, periodStart, periodEnd));

  if (periodReviews.length === 0) {
    return {
      totalReviews: 0, childAttended: 0, writtenViews: 0, advocateAttended: 0,
      viewsConveyedByWorker: 0, refused: 0, notInvited: 0,
      meaningfulParticipationRate: 0, childViewsCapturedRate: 0,
      parentInvitedRate: 0, parentAttendedRate: 0, carerAttendedRate: 0,
      socialWorkerAttendedRate: 0, overallScore: 0,
    };
  }

  const attended = periodReviews.filter((r) =>
    r.participationMethod === "attended_in_person" || r.participationMethod === "attended_virtually",
  ).length;
  const written = periodReviews.filter((r) => r.participationMethod === "written_views").length;
  const advocate = periodReviews.filter((r) => r.participationMethod === "advocate_attended").length;
  const conveyed = periodReviews.filter((r) => r.participationMethod === "views_conveyed_by_worker").length;
  const refused = periodReviews.filter((r) => r.participationMethod === "refused_to_participate").length;
  const notInvited = periodReviews.filter((r) => r.participationMethod === "not_invited").length;

  // Meaningful participation = attended + written + advocate
  const meaningful = attended + written + advocate;
  const meaningfulRate = pct(meaningful, periodReviews.length);

  const viewsCaptured = periodReviews.filter((r) => r.childViewsCaptured).length;
  const viewsRate = pct(viewsCaptured, periodReviews.length);

  const parentInvited = periodReviews.filter((r) => r.parentInvited).length;
  const parentAttended = periodReviews.filter((r) => r.parentAttended).length;
  const carerAttended = periodReviews.filter((r) => r.carerAttended).length;
  const swAttended = periodReviews.filter((r) => r.socialWorkerAttended).length;

  // Scoring — 25 points max
  let score = 0;

  // Meaningful participation rate: up to 12 points
  score += (meaningfulRate / 100) * 12;

  // Child views captured: up to 6 points
  score += (viewsRate / 100) * 6;

  // Not-invited penalty: -2 points per "not_invited" (harsh — this should never happen)
  score -= notInvited * 2;

  // Multi-agency attendance bonus: up to 4 points
  const swRate = pct(swAttended, periodReviews.length);
  const carerRate = pct(carerAttended, periodReviews.length);
  score += (swRate / 100) * 2;
  score += (carerRate / 100) * 2;

  // Advocacy support bonus: up to 1 point
  if (advocate > 0) {
    score += 1;
  }

  return {
    totalReviews: periodReviews.length,
    childAttended: attended,
    writtenViews: written,
    advocateAttended: advocate,
    viewsConveyedByWorker: conveyed,
    refused,
    notInvited,
    meaningfulParticipationRate: meaningfulRate,
    childViewsCapturedRate: viewsRate,
    parentInvitedRate: pct(parentInvited, periodReviews.length),
    parentAttendedRate: pct(parentAttended, periodReviews.length),
    carerAttendedRate: pct(carerAttended, periodReviews.length),
    socialWorkerAttendedRate: pct(swAttended, periodReviews.length),
    overallScore: Math.round(clamp(score, 0, 25) * 10) / 10,
  };
}

/**
 * Evaluate recommendation tracking and implementation.
 * Reviews generate recommendations that must be actioned — overdue recommendations
 * indicate poor follow-through and are a key Ofsted concern.
 * Score: 0–25
 */
export function evaluateRecommendationTracking(
  recommendations: ReviewRecommendation[],
  periodStart: string,
  periodEnd: string,
  referenceDate: string,
): RecommendationTrackingResult {
  // Recommendations from reviews in the period
  const periodRecs = recommendations.filter((r) => isInPeriod(r.dueDate, periodStart, periodEnd) || r.status === "overdue");

  if (periodRecs.length === 0) {
    return {
      totalRecommendations: 0, completed: 0, inProgress: 0, overdue: 0,
      notStarted: 0, noLongerApplicable: 0, completionRate: 0, overdueRate: 0,
      urgentCompletionRate: 0, averageCompletionDays: 0, overallScore: 0,
    };
  }

  const completed = periodRecs.filter((r) => r.status === "completed").length;
  const inProgress = periodRecs.filter((r) => r.status === "in_progress").length;
  const overdue = periodRecs.filter((r) => r.status === "overdue").length;
  const notStarted = periodRecs.filter((r) => r.status === "not_started").length;
  const noLongerApplicable = periodRecs.filter((r) => r.status === "no_longer_applicable").length;

  const actionable = periodRecs.length - noLongerApplicable;
  const completionRate = pct(completed, actionable);
  const overdueRate = pct(overdue, actionable);

  // Urgent recommendation completion
  const urgent = periodRecs.filter((r) => r.priority === "urgent");
  const urgentCompleted = urgent.filter((r) => r.status === "completed").length;
  const urgentRate = pct(urgentCompleted, urgent.length);

  // Average completion time
  const completedWithDates = periodRecs.filter((r) => r.status === "completed" && r.completedDate);
  const totalCompletionDays = completedWithDates.reduce((sum, r) => {
    // Days from review recommendation creation to completion
    // Use dueDate as proxy for when the recommendation was created
    const days = Math.max(0, daysBetween(r.dueDate, r.completedDate!));
    return sum + days;
  }, 0);
  const avgCompletionDays = completedWithDates.length > 0
    ? Math.round((totalCompletionDays / completedWithDates.length) * 10) / 10
    : 0;

  // Scoring — 25 points max
  let score = 0;

  // Completion rate: up to 12 points
  score += (completionRate / 100) * 12;

  // Low overdue rate: up to 6 points (inverted — high overdue = low score)
  score += ((100 - overdueRate) / 100) * 6;

  // Urgent completion: up to 4 points
  if (urgent.length > 0) {
    score += (urgentRate / 100) * 4;
  } else {
    // No urgent recommendations — redistribute
    score += (completionRate / 100) * 4;
  }

  // In-progress credit: up to 3 points (shows active engagement)
  const activeRate = pct(completed + inProgress, actionable);
  score += (activeRate / 100) * 3;

  return {
    totalRecommendations: periodRecs.length,
    completed,
    inProgress,
    overdue,
    notStarted,
    noLongerApplicable,
    completionRate,
    overdueRate,
    urgentCompletionRate: urgentRate,
    averageCompletionDays: avgCompletionDays,
    overallScore: Math.round(clamp(score, 0, 25) * 10) / 10,
  };
}

/**
 * Evaluate IRO effectiveness.
 * The IRO should be independent, conduct mid-point checks, speak to children
 * between reviews, and use escalation/dispute resolution when needed.
 * Score: 0–20
 */
export function evaluateIROEffectiveness(
  reviews: LACReview[],
  iroActivities: IROActivity[],
  periodStart: string,
  periodEnd: string,
): IROEffectivenessResult {
  const periodReviews = reviews.filter((r) => isInPeriod(r.actualDate || r.dueDate, periodStart, periodEnd));
  const periodActivities = iroActivities.filter((a) => isInPeriod(a.activityDate, periodStart, periodEnd));

  if (periodReviews.length === 0 && periodActivities.length === 0) {
    return {
      totalIROActivities: 0, midPointChecks: 0, monitoringVisits: 0,
      consultations: 0, disputeResolutions: 0, escalations: 0,
      childSpokenToRate: 0, issuesIdentifiedCount: 0, iroIndependenceRate: 0,
      overallScore: 0,
    };
  }

  const midPoints = periodActivities.filter((a) => a.activityType === "mid_point_check").length;
  const monitoring = periodActivities.filter((a) => a.activityType === "monitoring_visit").length;
  const consultations = periodActivities.filter((a) => a.activityType === "consultation").length;
  const disputes = periodActivities.filter((a) => a.activityType === "dispute_resolution").length;
  const escalations = periodActivities.filter((a) => a.activityType === "escalation").length;

  // Child spoken to rate across all IRO activities
  const spokenTo = periodActivities.filter((a) => a.childSpokenTo).length;
  const spokenToRate = pct(spokenTo, periodActivities.length);

  // Issues identified
  const issuesCount = periodActivities.reduce((sum, a) => sum + a.issuesIdentified.length, 0);

  // IRO independence across reviews
  const independentReviews = periodReviews.filter((r) => r.iroIndependent).length;
  const independenceRate = pct(independentReviews, periodReviews.length);

  // Scoring — 20 points max
  let score = 0;

  // IRO independence: up to 6 points (critical requirement)
  if (periodReviews.length > 0) {
    score += (independenceRate / 100) * 6;
  } else {
    score += 0;
  }

  // Mid-point checks: up to 5 points
  // Each child should have at least 1 mid-point check per review cycle
  if (periodReviews.length > 0) {
    const midPointRatio = Math.min(midPoints / periodReviews.length, 1);
    score += midPointRatio * 5;
  }

  // Child spoken to: up to 5 points
  if (periodActivities.length > 0) {
    score += (spokenToRate / 100) * 5;
  }

  // Active IRO engagement (monitoring, consultation, escalation): up to 4 points
  const engagementActivities = monitoring + consultations + disputes + escalations;
  if (engagementActivities > 0) {
    // Base credit for any engagement
    score += Math.min(engagementActivities, 4);
  }

  return {
    totalIROActivities: periodActivities.length,
    midPointChecks: midPoints,
    monitoringVisits: monitoring,
    consultations,
    disputeResolutions: disputes,
    escalations,
    childSpokenToRate: spokenToRate,
    issuesIdentifiedCount: issuesCount,
    iroIndependenceRate: independenceRate,
    overallScore: Math.round(clamp(score, 0, 20) * 10) / 10,
  };
}

/**
 * Build per-child review profiles.
 */
export function buildChildReviewProfiles(
  reviews: LACReview[],
  recommendations: ReviewRecommendation[],
  iroActivities: IROActivity[],
  childIds: string[],
  periodStart: string,
  periodEnd: string,
): ChildReviewProfile[] {
  return childIds.map((childId) => {
    const childReviews = reviews.filter(
      (r) => r.childId === childId && isInPeriod(r.actualDate || r.dueDate, periodStart, periodEnd),
    );
    const childRecs = recommendations.filter((r) => r.childId === childId);
    const childIRO = iroActivities.filter(
      (a) => a.childId === childId && isInPeriod(a.activityDate, periodStart, periodEnd),
    );

    const childName = childReviews[0]?.childName || childRecs[0]?.childName || childIRO[0]?.childName || childId;

    const onTime = childReviews.filter((r) => r.wasTimely).length;
    const timelinessRate = pct(onTime, childReviews.length);

    const meaningful = childReviews.filter((r) =>
      r.participationMethod === "attended_in_person" ||
      r.participationMethod === "attended_virtually" ||
      r.participationMethod === "written_views" ||
      r.participationMethod === "advocate_attended",
    ).length;
    const participationRate = pct(meaningful, childReviews.length);

    const viewsCaptured = childReviews.filter((r) => r.childViewsCaptured).length;
    const viewsRate = pct(viewsCaptured, childReviews.length);

    const carePlanUpdated = childReviews.filter((r) => r.carePlanUpdated).length;
    const carePlanRate = pct(carePlanUpdated, childReviews.length);

    const completedRecs = childRecs.filter((r) => r.status === "completed").length;
    const overdueRecs = childRecs.filter((r) => r.status === "overdue").length;
    const actionableRecs = childRecs.filter((r) => r.status !== "no_longer_applicable").length;
    const recCompletionRate = pct(completedRecs, actionableRecs);

    const midPoints = childIRO.filter((a) => a.activityType === "mid_point_check").length;
    const spokenTo = childIRO.filter((a) => a.childSpokenTo).length;
    const spokenToRate = pct(spokenTo, childIRO.length);

    // Sort reviews by date to find last and next
    const sortedReviews = [...childReviews].sort((a, b) => {
      const dateA = a.actualDate || a.dueDate;
      const dateB = b.actualDate || b.dueDate;
      return dateA.localeCompare(dateB);
    });
    const lastReview = sortedReviews.length > 0 ? sortedReviews[sortedReviews.length - 1] : null;
    const lastReviewDate = lastReview?.actualDate || lastReview?.dueDate || null;
    const nextReviewDue = lastReview?.nextReviewDate || null;

    // Overall child score: 0–10
    let score = 0;
    if (childReviews.length > 0) {
      score += (timelinessRate / 100) * 3;    // Timeliness: 3 pts
      score += (participationRate / 100) * 3;  // Participation: 3 pts
      score += (viewsRate / 100) * 1;          // Views captured: 1 pt
      score += (recCompletionRate / 100) * 2;  // Recommendations: 2 pts
      if (midPoints > 0) score += 1;           // Mid-point check: 1 pt
    }

    return {
      childId,
      childName,
      totalReviews: childReviews.length,
      reviewsOnTime: onTime,
      timelinessRate,
      participationRate,
      childViewsCapturedRate: viewsRate,
      carePlanUpdatedRate: carePlanRate,
      totalRecommendations: childRecs.length,
      completedRecommendations: completedRecs,
      overdueRecommendations: overdueRecs,
      recommendationCompletionRate: recCompletionRate,
      iroMidPointChecks: midPoints,
      iroChildSpokenToRate: spokenToRate,
      lastReviewDate,
      nextReviewDue,
      overallScore: Math.round(clamp(score, 0, 10) * 10) / 10,
    };
  });
}

// ── Main Intelligence Function ──────────────────────────────────────────────

/**
 * Generate comprehensive LAC Review intelligence for a home.
 */
export function generateLACReviewIntelligence(
  reviews: LACReview[],
  recommendations: ReviewRecommendation[],
  iroActivities: IROActivity[],
  childIds: string[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
  referenceDate: string,
): LACReviewIntelligence {
  const timeliness = evaluateReviewTimeliness(reviews, periodStart, periodEnd);
  const participation = evaluateChildParticipation(reviews, periodStart, periodEnd);
  const recTracking = evaluateRecommendationTracking(recommendations, periodStart, periodEnd, referenceDate);
  const iro = evaluateIROEffectiveness(reviews, iroActivities, periodStart, periodEnd);
  const childProfiles = buildChildReviewProfiles(reviews, recommendations, iroActivities, childIds, periodStart, periodEnd);

  const overallScore = Math.round(
    (timeliness.overallScore + participation.overallScore + recTracking.overallScore + iro.overallScore) * 10,
  ) / 10;
  const rating = ratingFromScore(overallScore);

  // ── Strengths ──
  const strengths: string[] = [];
  if (timeliness.timelinessRate >= 90) {
    strengths.push("Excellent review timeliness — over 90% of reviews held on or before the statutory due date");
  }
  if (timeliness.minutesDistributedOnTimeRate >= 90) {
    strengths.push("Review minutes consistently distributed within 5 working days");
  }
  if (participation.meaningfulParticipationRate >= 85) {
    strengths.push("High rate of meaningful child participation in reviews, supporting their right to be heard");
  }
  if (participation.childViewsCapturedRate >= 90) {
    strengths.push("Children's views are consistently captured and recorded in reviews");
  }
  if (recTracking.completionRate >= 80) {
    strengths.push("Strong follow-through on review recommendations with high completion rate");
  }
  if (recTracking.overdueRate <= 10 && recTracking.totalRecommendations > 0) {
    strengths.push("Very low overdue rate for review recommendations, indicating effective monitoring");
  }
  if (iro.iroIndependenceRate >= 95 && timeliness.totalReviews > 0) {
    strengths.push("IRO independence maintained across all reviews, ensuring objectivity");
  }
  if (iro.midPointChecks > 0 && iro.childSpokenToRate >= 80) {
    strengths.push("IRO actively engages with children between reviews through mid-point checks");
  }
  if (participation.advocateAttended > 0) {
    strengths.push("Children have access to independent advocacy to support their participation in reviews");
  }

  // ── Areas for Improvement ──
  const areasForImprovement: string[] = [];
  if (timeliness.timelinessRate < 80 && timeliness.totalReviews > 0) {
    areasForImprovement.push("Review timeliness needs improvement — some reviews are not being held within statutory timescales");
  }
  if (timeliness.minutesDistributedOnTimeRate < 80 && timeliness.totalReviews > 0) {
    areasForImprovement.push("Minutes distribution needs to be more timely — should be within 5 working days of the review");
  }
  if (participation.meaningfulParticipationRate < 75 && participation.totalReviews > 0) {
    areasForImprovement.push("Child participation in reviews could be strengthened — consider varied approaches to encourage engagement");
  }
  if (participation.notInvited > 0) {
    areasForImprovement.push(`${participation.notInvited} review(s) where the child was not invited — this must be addressed immediately`);
  }
  if (recTracking.overdueRate > 20 && recTracking.totalRecommendations > 0) {
    areasForImprovement.push("High proportion of overdue recommendations — monitoring and tracking systems need strengthening");
  }
  if (iro.iroIndependenceRate < 100 && timeliness.totalReviews > 0) {
    areasForImprovement.push("IRO independence should be maintained for all reviews to ensure objectivity and challenge");
  }
  if (iro.midPointChecks === 0 && timeliness.totalReviews > 0) {
    areasForImprovement.push("No IRO mid-point checks recorded — IROs should be monitoring between reviews");
  }

  // ── Actions ──
  const actions: string[] = [];
  if (participation.notInvited > 0) {
    actions.push("URGENT: Ensure all children are invited to their reviews and supported to participate");
  }
  if (recTracking.overdue > 0) {
    actions.push(`HIGH: ${recTracking.overdue} recommendation(s) are overdue — review and action or formally close`);
  }
  if (timeliness.reviewsLate > 0) {
    actions.push(`MEDIUM: Review scheduling processes — ${timeliness.reviewsLate} review(s) were held late`);
  }
  if (iro.midPointChecks === 0 && timeliness.totalReviews > 0) {
    actions.push("MEDIUM: Request IRO mid-point checks between reviews for all children");
  }
  if (participation.meaningfulParticipationRate < 75 && participation.totalReviews > 0) {
    actions.push("MEDIUM: Develop child-friendly approaches to increase meaningful participation in reviews");
  }
  if (timeliness.minutesDistributedOnTimeRate < 80 && timeliness.totalReviews > 0) {
    actions.push("LOW: Implement a system to ensure review minutes are distributed within 5 working days");
  }

  // ── Regulatory Links ──
  const regulatoryLinks: string[] = [
    "Care Planning, Placement and Case Review Regulations 2010 — Reg 33 (timing of reviews), Reg 36 (manner of reviews)",
    "IRO Handbook 2010 — statutory guidance on the role of the Independent Reviewing Officer",
    "Children Act 1989 s26 — review of cases and representations",
    "CHR 2015 Reg 45 — review of quality of care by the registered person",
    "SCCIF — review quality, child participation, and recommendation implementation as key judgement areas",
    "UNCRC Article 12 — the right of the child to express views in all matters affecting them",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    referenceDate,
    overallScore,
    rating,
    timeliness,
    participation,
    recommendations: recTracking,
    iroEffectiveness: iro,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
