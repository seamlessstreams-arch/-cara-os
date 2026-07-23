// ══════════════════════════════════════════════════════════════════════════════
// CARE PLANNING COMPLIANCE INTELLIGENCE ENGINE
//
// Pure deterministic engine for tracking care plan reviews, LAC reviews,
// pathway plans, PEP reviews, health reviews, and action completion — the
// backbone of statutory looked-after children planning obligations.
//
// Regulatory basis:
//   - CHR 2015, Reg 14 — Care planning
//   - Care Planning Regulations 2010 — Review timescales
//   - Children Act 1989, s26 — Reviews of looked-after children
//   - CHR 2015, Reg 5 — Quality and purpose of care
//   - SCCIF — "Experiences and progress" — planning and review
//   - Pathway planning duties (Children Act 1989, s23C/D)
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

import { withinPeriod } from "@/lib/date-period";
import { below, formatRate, meets, rate, rateOf, weightedMeanOf } from "@/lib/metrics/rate";

// ── Types ──────────────────────────────────────────────────────────────────

export type ReviewType =
  | "lac_review"
  | "care_plan_review"
  | "placement_plan_review"
  | "pep_review"
  | "health_review"
  | "pathway_plan_review"
  | "risk_assessment_review"
  | "behaviour_support_review";

export type ReviewStatus =
  | "completed_on_time"
  | "completed_late"
  | "overdue"
  | "scheduled"
  | "cancelled";

export type ActionStatus =
  | "completed"
  | "in_progress"
  | "overdue"
  | "not_started";

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface CareChild {
  id: string;
  name: string;
  dateOfBirth: string;
  placementStartDate: string;
  isEligibleChild: boolean; // 16+ pathway planning
  currentPlacement: boolean;
}

export interface PlannedReview {
  id: string;
  childId: string;
  reviewType: ReviewType;
  dueDate: string;
  actualDate?: string;
  status: ReviewStatus;
  chairedBy?: string;
  childParticipated: boolean;
  childViewsRecorded: boolean;
  parentInvited: boolean;
  parentAttended: boolean;
  socialWorkerAttended: boolean;
  iroConducted?: boolean; // For LAC reviews
  actionsAgreed: number;
  keyDecisions?: string[];
}

export interface ReviewAction {
  id: string;
  reviewId: string;
  childId: string;
  description: string;
  assignedTo: string;
  dueDate: string;
  completedDate?: string;
  status: ActionStatus;
  category: string;
}

export interface CarePlanDocument {
  id: string;
  childId: string;
  documentType: "care_plan" | "placement_plan" | "pathway_plan" | "pep" | "health_plan" | "risk_assessment" | "behaviour_support_plan";
  lastUpdated: string;
  nextReviewDue: string;
  isUpToDate: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface ReviewComplianceResult {
  totalReviewsDue: number;
  completedOnTime: number;
  completedLate: number;
  overdue: number;
  scheduled: number;
  cancelled: number;
  onTimeRate: number | null;
  completionRate: number | null;
}

export interface ReviewTypeBreakdown {
  reviewType: ReviewType;
  total: number;
  onTime: number;
  late: number;
  overdue: number;
  onTimeRate: number | null;
}

export interface ActionComplianceResult {
  totalActions: number;
  completed: number;
  inProgress: number;
  overdue: number;
  notStarted: number;
  completionRate: number | null;
  overdueRate: number | null;
}

export interface ChildPlanningProfile {
  childId: string;
  childName: string;
  reviewsDue: number;
  reviewsCompleted: number;
  reviewsOverdue: number;
  actionCompletionRate: number | null;
  actionsOverdue: number;
  documentsUpToDate: number;
  documentsOutdated: number;
  childParticipationRate: number | null;
  primaryConcern?: string;
}

export interface CarePlanningIntelligenceResult {
  homeId: string;
  assessedAt: string;
  periodStart: string;
  periodEnd: string;

  // Overall
  overallScore: number | null;
  rating: "outstanding" | "good" | "requires_improvement" | "inadequate" | "unmeasured";

  // Review compliance
  reviewCompliance: ReviewComplianceResult;
  reviewTypeBreakdown: ReviewTypeBreakdown[];

  // Action compliance
  actionCompliance: ActionComplianceResult;

  // Document currency
  documentsUpToDate: number;
  documentsOutdated: number;
  documentCurrencyRate: number | null;

  // Participation
  childParticipationRate: number | null;
  parentParticipationRate: number | null;
  socialWorkerAttendanceRate: number | null;

  // Per-child
  childProfiles: ChildPlanningProfile[];

  // Insights
  strengths: string[];
  areasForDevelopment: string[];
  immediateActions: string[];
  regulatoryLinks: string[];
}

// ── Core: Evaluate Review Compliance ──────────────────────────────────────

export function evaluateReviewCompliance(
  reviews: PlannedReview[],
  periodStart: string,
  periodEnd: string,
): ReviewComplianceResult {
  const periodReviews = reviews.filter(
    (r) => withinPeriod(r.dueDate, periodStart, periodEnd),
  );

  const completedOnTime = periodReviews.filter((r) => r.status === "completed_on_time").length;
  const completedLate = periodReviews.filter((r) => r.status === "completed_late").length;
  const overdue = periodReviews.filter((r) => r.status === "overdue").length;
  const scheduled = periodReviews.filter((r) => r.status === "scheduled").length;
  const cancelled = periodReviews.filter((r) => r.status === "cancelled").length;
  const completed = completedOnTime + completedLate;

  return {
    totalReviewsDue: periodReviews.length,
    completedOnTime,
    completedLate,
    overdue,
    scheduled,
    cancelled,
    onTimeRate: rate(completedOnTime, periodReviews.length),
    completionRate: rate(completed, periodReviews.length),
  };
}

// ── Core: Breakdown by Review Type ────────────────────────────────────────

export function buildReviewTypeBreakdown(
  reviews: PlannedReview[],
  periodStart: string,
  periodEnd: string,
): ReviewTypeBreakdown[] {
  const periodReviews = reviews.filter(
    (r) => withinPeriod(r.dueDate, periodStart, periodEnd),
  );

  const typeMap = new Map<ReviewType, PlannedReview[]>();
  for (const review of periodReviews) {
    const existing = typeMap.get(review.reviewType) || [];
    existing.push(review);
    typeMap.set(review.reviewType, existing);
  }

  return [...typeMap.entries()].map(([reviewType, typeReviews]) => {
    const onTime = typeReviews.filter((r) => r.status === "completed_on_time").length;
    const late = typeReviews.filter((r) => r.status === "completed_late").length;
    const overdue = typeReviews.filter((r) => r.status === "overdue").length;

    return {
      reviewType,
      total: typeReviews.length,
      onTime,
      late,
      overdue,
      onTimeRate: rate(onTime, typeReviews.length),
    };
    // Worst on-time rate first; types with nothing to measure sort last.
  }).sort((a, b) => {
    if (a.onTimeRate === null) return b.onTimeRate === null ? 0 : 1;
    if (b.onTimeRate === null) return -1;
    return a.onTimeRate - b.onTimeRate;
  });
}

// ── Core: Evaluate Action Compliance ──────────────────────────────────────

export function evaluateActionCompliance(
  actions: ReviewAction[],
  periodStart: string,
  periodEnd: string,
): ActionComplianceResult {
  const periodActions = actions.filter(
    (a) => withinPeriod(a.dueDate, periodStart, periodEnd),
  );

  const completed = periodActions.filter((a) => a.status === "completed").length;
  const inProgress = periodActions.filter((a) => a.status === "in_progress").length;
  const overdue = periodActions.filter((a) => a.status === "overdue").length;
  const notStarted = periodActions.filter((a) => a.status === "not_started").length;

  return {
    totalActions: periodActions.length,
    completed,
    inProgress,
    overdue,
    notStarted,
    completionRate: rate(completed, periodActions.length),
    overdueRate: rate(overdue, periodActions.length),
  };
}

// ── Core: Build Child Planning Profiles ───────────────────────────────────

export function buildChildPlanningProfiles(
  children: CareChild[],
  reviews: PlannedReview[],
  actions: ReviewAction[],
  documents: CarePlanDocument[],
  periodStart: string,
  periodEnd: string,
): ChildPlanningProfile[] {
  const activeChildren = children.filter((c) => c.currentPlacement);

  return activeChildren.map((child) => {
    const childReviews = reviews.filter(
      (r) => r.childId === child.id && withinPeriod(r.dueDate, periodStart, periodEnd),
    );
    const childActions = actions.filter(
      (a) => a.childId === child.id && withinPeriod(a.dueDate, periodStart, periodEnd),
    );
    const childDocs = documents.filter((d) => d.childId === child.id);

    const completed = childReviews.filter(
      (r) => r.status === "completed_on_time" || r.status === "completed_late",
    );
    const overdue = childReviews.filter((r) => r.status === "overdue");
    const actionsCompleted = childActions.filter((a) => a.status === "completed").length;
    const actionsOverdue = childActions.filter((a) => a.status === "overdue").length;
    const docsUpToDate = childDocs.filter((d) => d.isUpToDate).length;
    const docsOutdated = childDocs.filter((d) => !d.isUpToDate).length;

    const participated = completed.filter((r) => r.childParticipated);
    const participationRate = rateOf(participated, completed);

    let primaryConcern: string | undefined;
    if (overdue.length >= 2) {
      primaryConcern = `${overdue.length} reviews overdue — statutory timescales not met`;
    } else if (actionsOverdue >= 3) {
      primaryConcern = `${actionsOverdue} review actions overdue — care plan not progressing`;
    } else if (docsOutdated >= 2) {
      primaryConcern = `${docsOutdated} documents outdated — planning documentation not current`;
    }

    return {
      childId: child.id,
      childName: child.name,
      reviewsDue: childReviews.length,
      reviewsCompleted: completed.length,
      reviewsOverdue: overdue.length,
      actionCompletionRate: rate(actionsCompleted, childActions.length),
      actionsOverdue,
      documentsUpToDate: docsUpToDate,
      documentsOutdated: docsOutdated,
      childParticipationRate: participationRate,
      primaryConcern,
    };
  });
}

// ── Main: Generate Care Planning Intelligence ─────────────────────────────

export function generateCarePlanningIntelligence(
  children: CareChild[],
  reviews: PlannedReview[],
  actions: ReviewAction[],
  documents: CarePlanDocument[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): CarePlanningIntelligenceResult {
  const assessedAt = new Date().toISOString();

  const periodReviews = reviews.filter(
    (r) => withinPeriod(r.dueDate, periodStart, periodEnd),
  );

  const reviewCompliance = evaluateReviewCompliance(reviews, periodStart, periodEnd);
  const reviewTypeBreakdown = buildReviewTypeBreakdown(reviews, periodStart, periodEnd);
  const actionCompliance = evaluateActionCompliance(actions, periodStart, periodEnd);
  const childProfiles = buildChildPlanningProfiles(children, reviews, actions, documents, periodStart, periodEnd);

  // Document currency
  const activeChildren = children.filter((c) => c.currentPlacement);
  const allDocs = documents.filter((d) => activeChildren.some((c) => c.id === d.childId));
  const docsUpToDate = allDocs.filter((d) => d.isUpToDate).length;
  const docsOutdated = allDocs.filter((d) => !d.isUpToDate).length;
  const documentCurrencyRate = rate(docsUpToDate, allDocs.length);

  // Participation rates
  const completedReviews = periodReviews.filter(
    (r) => r.status === "completed_on_time" || r.status === "completed_late",
  );
  const childParticipationRate = rateOf(
    completedReviews.filter((r) => r.childParticipated), completedReviews,
  );
  const parentParticipationRate = rateOf(
    completedReviews.filter((r) => r.parentAttended), completedReviews,
  );
  const socialWorkerAttendanceRate = rateOf(
    completedReviews.filter((r) => r.socialWorkerAttended), completedReviews,
  );

  // Score
  const overallScore = calculateCarePlanningScore(
    reviewCompliance, actionCompliance, documentCurrencyRate,
    childParticipationRate, childProfiles,
  );
  const rating = getCarePlanningRating(overallScore);

  // Insights
  const strengths = generatePlanningStrengths(
    reviewCompliance, actionCompliance, documentCurrencyRate,
    childParticipationRate, parentParticipationRate,
  );
  const areasForDevelopment = generatePlanningDevelopment(
    reviewCompliance, actionCompliance, documentCurrencyRate,
    childParticipationRate, reviewTypeBreakdown, childProfiles,
  );
  const immediateActions = generatePlanningActions(
    reviewCompliance, actionCompliance, childProfiles, reviewTypeBreakdown,
  );
  const regulatoryLinks = generatePlanningRegulatoryLinks(
    reviewCompliance, childProfiles, children,
  );

  return {
    homeId,
    assessedAt,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    reviewCompliance,
    reviewTypeBreakdown,
    actionCompliance,
    documentsUpToDate: docsUpToDate,
    documentsOutdated: docsOutdated,
    documentCurrencyRate,
    childParticipationRate,
    parentParticipationRate,
    socialWorkerAttendanceRate,
    childProfiles,
    strengths,
    areasForDevelopment,
    immediateActions,
    regulatoryLinks,
  };
}

// ── Scoring ────────────────────────────────────────────────────────────────

function calculateCarePlanningScore(
  review: ReviewComplianceResult,
  actions: ActionComplianceResult,
  docCurrencyRate: number | null,
  childParticipation: number | null,
  profiles: ChildPlanningProfile[],
): number | null {
  // Overdue headroom, not a rate: 0% of actions overdue scores full marks,
  // 10% or more scores none.
  const overdueHeadroom = actions.overdueRate === null
    ? null
    : Math.max(0, 100 - actions.overdueRate * 10);

  // Consistency across children — only meaningful once there are children.
  const childrenWithConcerns = profiles.filter((p) => p.primaryConcern);
  const consistency = profiles.length === 0
    ? null
    : Math.max(0, 100 - childrenWithConcerns.length * 30);

  return weightedMeanOf([
    { score: review.onTimeRate, weight: 20 },
    { score: review.completionRate, weight: 15 },
    { score: actions.completionRate, weight: 15 },
    { score: overdueHeadroom, weight: 10 },
    { score: docCurrencyRate, weight: 15 },
    { score: childParticipation, weight: 15 },
    { score: consistency, weight: 10 },
  ]);
}

function getCarePlanningRating(
  score: number | null,
): "outstanding" | "good" | "requires_improvement" | "inadequate" | "unmeasured" {
  if (score === null) return "unmeasured";
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Insight Generation ─────────────────────────────────────────────────────

function generatePlanningStrengths(
  review: ReviewComplianceResult,
  actions: ActionComplianceResult,
  docCurrencyRate: number | null,
  childParticipation: number | null,
  parentParticipation: number | null,
): string[] {
  const strengths: string[] = [];

  if (meets(review.onTimeRate, 90)) {
    strengths.push("Reviews consistently completed within statutory timescales — strong compliance culture");
  }
  if (meets(actions.completionRate, 85)) {
    strengths.push("Review actions have a high completion rate — care plans are actively progressed");
  }
  if (meets(docCurrencyRate, 90)) {
    strengths.push("Planning documentation is current and up-to-date across all children");
  }
  if (meets(childParticipation, 90)) {
    strengths.push("Excellent child participation in reviews — children are active partners in planning");
  }
  if (meets(parentParticipation, 70)) {
    strengths.push("Good parental participation in reviews — family engagement is prioritised");
  }
  if (review.cancelled === 0 && review.totalReviewsDue > 0) {
    strengths.push("No reviews cancelled this period — demonstrates organisational commitment to planning");
  }

  return strengths;
}

function generatePlanningDevelopment(
  review: ReviewComplianceResult,
  actions: ActionComplianceResult,
  docCurrencyRate: number | null,
  childParticipation: number | null,
  typeBreakdown: ReviewTypeBreakdown[],
  profiles: ChildPlanningProfile[],
): string[] {
  const areas: string[] = [];

  if (below(review.onTimeRate, 80)) {
    areas.push(`On-time review rate is ${formatRate(review.onTimeRate)} — review scheduling and preparation processes`);
  }
  if (review.overdue > 0) {
    areas.push(`${review.overdue} review(s) currently overdue — prioritise immediate completion`);
  }
  if (actions.overdueRate !== null && actions.overdueRate > 20) {
    areas.push(`${formatRate(actions.overdueRate)} of review actions are overdue — embed action tracking in supervision`);
  }
  if (below(docCurrencyRate, 80)) {
    areas.push(`Document currency rate is ${formatRate(docCurrencyRate)} — schedule document review alongside care plan reviews`);
  }
  if (below(childParticipation, 75)) {
    areas.push(`Child participation is ${formatRate(childParticipation)} — review barriers and offer advocacy support`);
  }
  if (review.totalReviewsDue === 0) {
    areas.push("No reviews due or recorded for this period — planning compliance cannot be evidenced without records");
  }

  const weakTypes = typeBreakdown.filter((t) => below(t.onTimeRate, 60) && t.total >= 2);
  for (const type of weakTypes) {
    areas.push(`${type.reviewType.replace(/_/g, " ")} reviews: only ${formatRate(type.onTimeRate)} on time — review scheduling process`);
  }

  return areas;
}

function generatePlanningActions(
  review: ReviewComplianceResult,
  actions: ActionComplianceResult,
  profiles: ChildPlanningProfile[],
  typeBreakdown: ReviewTypeBreakdown[],
): string[] {
  const planActions: string[] = [];

  if (review.overdue > 0) {
    const overdueTypes = typeBreakdown.filter((t) => t.overdue > 0);
    for (const type of overdueTypes) {
      planActions.push(
        `URGENT: ${type.overdue} ${type.reviewType.replace(/_/g, " ")} review(s) overdue. Schedule within 5 working days to restore statutory compliance.`,
      );
    }
  }

  const childrenWithConcerns = profiles.filter((p) => p.primaryConcern);
  for (const child of childrenWithConcerns) {
    planActions.push(
      `HIGH: ${child.childName} — ${child.primaryConcern}`,
    );
  }

  if (actions.overdue > 3) {
    planActions.push(
      `MEDIUM: ${actions.overdue} review actions overdue. Assign to responsible staff in next supervision cycle.`,
    );
  }

  if (planActions.length === 0) {
    planActions.push(
      review.totalReviewsDue === 0 && actions.totalActions === 0
        ? "No reviews or review actions recorded for this period. Care planning compliance cannot be assessed until records exist."
        : "No immediate actions required. Care planning compliance is strong and child-centred.",
    );
  }

  return planActions;
}

function generatePlanningRegulatoryLinks(
  review: ReviewComplianceResult,
  profiles: ChildPlanningProfile[],
  children: CareChild[],
): string[] {
  const links = new Set<string>();

  links.add("CHR 2015, Reg 14 — Care planning");
  links.add("SCCIF: Experiences and progress — Planning and review");

  if (review.overdue > 0 || review.completedLate > 0) {
    links.add("Care Planning Regulations 2010 — Statutory review timescales");
    links.add("Children Act 1989, s26 — Reviews of looked-after children");
  }

  links.add("CHR 2015, Reg 5 — Quality and purpose of care");

  const eligibleChildren = children.filter((c) => c.isEligibleChild && c.currentPlacement);
  if (eligibleChildren.length > 0) {
    links.add("Children Act 1989, s23C/D — Pathway planning duties");
  }

  return [...links];
}

// ── Utility: Labels ────────────────────────────────────────────────────────

export function getReviewTypeLabel(type: ReviewType): string {
  const labels: Record<ReviewType, string> = {
    lac_review: "LAC Review",
    care_plan_review: "Care Plan Review",
    placement_plan_review: "Placement Plan Review",
    pep_review: "PEP Review",
    health_review: "Health Review",
    pathway_plan_review: "Pathway Plan Review",
    risk_assessment_review: "Risk Assessment Review",
    behaviour_support_review: "Behaviour Support Review",
  };
  return labels[type];
}

export function getReviewStatusLabel(status: ReviewStatus): string {
  const labels: Record<ReviewStatus, string> = {
    completed_on_time: "Completed On Time",
    completed_late: "Completed Late",
    overdue: "Overdue",
    scheduled: "Scheduled",
    cancelled: "Cancelled",
  };
  return labels[status];
}

export function getActionStatusLabel(status: ActionStatus): string {
  const labels: Record<ActionStatus, string> = {
    completed: "Completed",
    in_progress: "In Progress",
    overdue: "Overdue",
    not_started: "Not Started",
  };
  return labels[status];
}
