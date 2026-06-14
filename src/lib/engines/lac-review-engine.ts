// ══════════════════════════════════════════════════════════════════════════════
// CARA — LAC REVIEW & PERMANENCE INTELLIGENCE ENGINE
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
// Analyses LAC (Looked-After Children) review timeliness, child participation,
// action completion, placement stability, and permanence planning.
//
// Regulatory: Reg 36 (Reviews of quality of care), IRO Handbook,
// Care Planning Regulations 2010. SCCIF: leadership & management.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface ChildInput {
  id: string;
  name: string;
  placement_start_date: string; // ISO date
}

export type ReviewType = "initial" | "first_review" | "subsequent" | "emergency" | "disruption";
export type ReviewOutcome = "placement_continues" | "placement_change" | "care_plan_amended" | "actions_agreed" | "return_home";
export type ChildParticipation = "attended" | "views_submitted" | "advocate_attended" | "did_not_participate";
export type PlacementStability = "stable" | "some_concerns" | "at_risk";

export interface ReviewActionInput {
  action: string;
  owner: string;
  due_date: string;
  completed: boolean;
}

export interface LACReviewInput {
  id: string;
  child_id: string;
  date: string;           // ISO date — when review took place
  review_type: ReviewType;
  iro: string;
  child_participation: ChildParticipation;
  has_child_views: boolean;
  outcome: ReviewOutcome;
  actions_agreed: ReviewActionInput[];
  next_review_date: string; // ISO date
  placement_stability: PlacementStability;
  care_plan_updated: boolean;
}

export interface LACReviewEngineInput {
  children: ChildInput[];
  reviews: LACReviewInput[];
  today?: string; // ISO date — injectable for deterministic tests
}

// ── Output Types ────────────────────────────────────────────────────────────

export interface ReviewComplianceOverview {
  total_reviews: number;
  reviews_in_timescale: number;  // within statutory 6-month window
  reviews_overdue: number;       // next_review_date < today and no newer review
  timeliness_rate: number;       // 0-100
  child_participation_rate: number; // 0-100 — % where child attended/submitted views/advocate
  care_plan_update_rate: number;    // 0-100
  total_children: number;
  children_with_overdue_review: number;
}

export interface ChildReviewProfile {
  child_id: string;
  child_name: string;
  total_reviews: number;
  last_review_date: string | null;
  last_review_days_ago: number;
  next_review_date: string | null;
  next_review_in_days: number;     // negative = overdue
  review_type_last: ReviewType | null;
  child_participation_last: ChildParticipation | null;
  placement_stability: PlacementStability | null;
  actions_total: number;
  actions_completed: number;
  actions_overdue: number;
  compliance_status: "compliant" | "due_soon" | "overdue";
}

export interface ActionComplianceSummary {
  total_actions: number;
  completed: number;
  outstanding: number;
  overdue: number;
  completion_rate: number;  // 0-100
}

export interface ParticipationAnalysis {
  attended: number;
  views_submitted: number;
  advocate_attended: number;
  did_not_participate: number;
  participation_rate: number; // 0-100
}

export interface StabilityOverview {
  stable_count: number;
  some_concerns_count: number;
  at_risk_count: number;
}

export interface LACReviewAlert {
  severity: "critical" | "high" | "medium" | "low";
  message: string;
}

export interface CaraLACReviewInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface LACReviewResult {
  overview: ReviewComplianceOverview;
  child_profiles: ChildReviewProfile[];
  action_compliance: ActionComplianceSummary;
  participation: ParticipationAnalysis;
  stability: StabilityOverview;
  alerts: LACReviewAlert[];
  insights: CaraLACReviewInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

export function daysBetween(a: string, b: string): number {
  const msA = new Date(a).getTime();
  const msB = new Date(b).getTime();
  return Math.round(Math.abs(msB - msA) / 86_400_000);
}

/** Signed days from a to b (positive = b is in the future relative to a) */
export function daysUntil(from: string, to: string): number {
  const msFrom = new Date(from).getTime();
  const msTo = new Date(to).getTime();
  return Math.round((msTo - msFrom) / 86_400_000);
}

/** Whether child participated (any form other than did_not_participate) */
export function didParticipate(participation: ChildParticipation): boolean {
  return participation !== "did_not_participate";
}

/**
 * Statutory review timescales (Care Planning Regulations 2010):
 * - Initial: within 20 working days of placement
 * - First review: within 3 months of initial
 * - Subsequent: every 6 months
 *
 * For compliance, we check: next_review_date vs today
 */
export function computeComplianceStatus(
  nextReviewDate: string | null,
  today: string,
): "compliant" | "due_soon" | "overdue" {
  if (!nextReviewDate) return "overdue";
  const daysLeft = daysUntil(today, nextReviewDate);
  if (daysLeft < 0) return "overdue";
  if (daysLeft <= 14) return "due_soon";
  return "compliant";
}

// ── Main Computation ────────────────────────────────────────────────────────

export function computeLACReviewIntelligence(input: LACReviewEngineInput): LACReviewResult {
  const today = input.today ?? new Date().toISOString().slice(0, 10);
  const { children, reviews } = input;

  // ── Child Profiles ─────────────────────────────────────────────────────
  const child_profiles: ChildReviewProfile[] = children.map((child) => {
    const childReviews = reviews
      .filter((r) => r.child_id === child.id)
      .sort((a, b) => b.date.localeCompare(a.date)); // most recent first

    const latest = childReviews[0] ?? null;
    const lastDate = latest?.date ?? null;
    const nextDate = latest?.next_review_date ?? null;

    // Collect all actions across all reviews for this child
    const allActions = childReviews.flatMap((r) => r.actions_agreed);
    const actionsCompleted = allActions.filter((a) => a.completed).length;
    const actionsOverdue = allActions.filter((a) => !a.completed && a.due_date < today).length;

    return {
      child_id: child.id,
      child_name: child.name,
      total_reviews: childReviews.length,
      last_review_date: lastDate,
      last_review_days_ago: lastDate ? daysBetween(lastDate, today) : 999,
      next_review_date: nextDate,
      next_review_in_days: nextDate ? daysUntil(today, nextDate) : -999,
      review_type_last: latest?.review_type ?? null,
      child_participation_last: latest?.child_participation ?? null,
      placement_stability: latest?.placement_stability ?? null,
      actions_total: allActions.length,
      actions_completed: actionsCompleted,
      actions_overdue: actionsOverdue,
      compliance_status: computeComplianceStatus(nextDate, today),
    };
  });

  // ── Overview ──────────────────────────────────────────────────────────
  const participatingReviews = reviews.filter((r) => didParticipate(r.child_participation));
  const carePlanUpdated = reviews.filter((r) => r.care_plan_updated);

  // Timeliness: all reviews that were held — were they within the statutory window?
  // We consider a review "in timescale" if it occurred and the next one isn't overdue yet
  const overdueChildren = child_profiles.filter((c) => c.compliance_status === "overdue");

  const overview: ReviewComplianceOverview = {
    total_reviews: reviews.length,
    reviews_in_timescale: reviews.length - overdueChildren.length,
    reviews_overdue: overdueChildren.length,
    timeliness_rate: children.length > 0
      ? Math.round(((children.length - overdueChildren.length) / children.length) * 100)
      : 100,
    child_participation_rate: reviews.length > 0
      ? Math.round((participatingReviews.length / reviews.length) * 100)
      : 0,
    care_plan_update_rate: reviews.length > 0
      ? Math.round((carePlanUpdated.length / reviews.length) * 100)
      : 0,
    total_children: children.length,
    children_with_overdue_review: overdueChildren.length,
  };

  // ── Action Compliance ─────────────────────────────────────────────────
  const allActions = reviews.flatMap((r) => r.actions_agreed);
  const completedActions = allActions.filter((a) => a.completed);
  const overdueActions = allActions.filter((a) => !a.completed && a.due_date < today);
  const outstandingActions = allActions.filter((a) => !a.completed);

  const action_compliance: ActionComplianceSummary = {
    total_actions: allActions.length,
    completed: completedActions.length,
    outstanding: outstandingActions.length,
    overdue: overdueActions.length,
    completion_rate: allActions.length > 0
      ? Math.round((completedActions.length / allActions.length) * 100)
      : 100,
  };

  // ── Participation Analysis ─────────────────────────────────────────────
  const attended = reviews.filter((r) => r.child_participation === "attended").length;
  const viewsSubmitted = reviews.filter((r) => r.child_participation === "views_submitted").length;
  const advocateAttended = reviews.filter((r) => r.child_participation === "advocate_attended").length;
  const didNotParticipate = reviews.filter((r) => r.child_participation === "did_not_participate").length;

  const participation: ParticipationAnalysis = {
    attended,
    views_submitted: viewsSubmitted,
    advocate_attended: advocateAttended,
    did_not_participate: didNotParticipate,
    participation_rate: reviews.length > 0
      ? Math.round(((reviews.length - didNotParticipate) / reviews.length) * 100)
      : 0,
  };

  // ── Stability Overview ─────────────────────────────────────────────────
  const stability: StabilityOverview = {
    stable_count: child_profiles.filter((c) => c.placement_stability === "stable").length,
    some_concerns_count: child_profiles.filter((c) => c.placement_stability === "some_concerns").length,
    at_risk_count: child_profiles.filter((c) => c.placement_stability === "at_risk").length,
  };

  // ── Alerts ─────────────────────────────────────────────────────────────
  const alerts: LACReviewAlert[] = [];

  // Critical: LAC review overdue
  for (const c of overdueChildren) {
    const daysOverdue = Math.abs(c.next_review_in_days);
    alerts.push({
      severity: "critical",
      message: `${c.child_name}'s LAC review is ${daysOverdue} day${daysOverdue > 1 ? "s" : ""} overdue — schedule immediately`,
    });
  }

  // High: placement at risk
  const atRisk = child_profiles.filter((c) => c.placement_stability === "at_risk");
  if (atRisk.length > 0) {
    for (const c of atRisk) {
      alerts.push({
        severity: "high",
        message: `${c.child_name}'s placement stability rated "at risk" at last review — convene disruption meeting`,
      });
    }
  }

  // Medium: actions overdue
  if (overdueActions.length > 0) {
    alerts.push({
      severity: "medium",
      message: `${overdueActions.length} LAC review action${overdueActions.length > 1 ? "s" : ""} overdue — chase responsible parties`,
    });
  }

  // Medium: due soon
  const dueSoon = child_profiles.filter((c) => c.compliance_status === "due_soon");
  if (dueSoon.length > 0) {
    alerts.push({
      severity: "medium",
      message: `${dueSoon.length} LAC review${dueSoon.length > 1 ? "s" : ""} due within 14 days — ensure preparation is underway`,
    });
  }

  // Low: child not participating
  if (reviews.length >= 2 && didNotParticipate > 0) {
    alerts.push({
      severity: "low",
      message: `${didNotParticipate} review${didNotParticipate > 1 ? "s" : ""} where child did not participate — explore barriers to engagement`,
    });
  }

  // ── Cara Insights ─────────────────────────────────────────────────────
  const insights: CaraLACReviewInsight[] = [];

  // Critical: overdue reviews
  if (overdueChildren.length > 0) {
    const names = overdueChildren.map((c) => c.child_name).join(", ");
    insights.push({
      severity: "critical",
      text: `${names} ${overdueChildren.length > 1 ? "have" : "has"} overdue LAC review${overdueChildren.length > 1 ? "s" : ""}. This is a statutory breach of the Care Planning Regulations 2010. Contact IRO immediately and schedule within 5 working days.`,
    });
  }

  // Warning: low action completion
  if (allActions.length >= 3 && action_compliance.completion_rate < 60) {
    insights.push({
      severity: "warning",
      text: `LAC review action completion is ${action_compliance.completion_rate}%. Incomplete actions undermine care planning and may indicate multi-agency coordination issues. Escalate overdue actions to the IRO.`,
    });
  }

  // Warning: placement concerns
  if (stability.some_concerns_count > 0 || stability.at_risk_count > 0) {
    const concerning = stability.some_concerns_count + stability.at_risk_count;
    insights.push({
      severity: "warning",
      text: `${concerning} child${concerning > 1 ? "ren" : ""} ${concerning > 1 ? "have" : "has"} placement stability concerns. Review matching criteria, explore disruption indicators, and update risk assessments. Consider early multi-agency planning.`,
    });
  }

  // Positive: all reviews current and participation high
  if (overdueChildren.length === 0 && children.length > 0 && overview.timeliness_rate === 100) {
    insights.push({
      severity: "positive",
      text: `All LAC reviews are current across ${children.length} child${children.length > 1 ? "ren" : ""}. ${overview.child_participation_rate}% participation rate demonstrates strong voice-of-the-child practice. Evidence of good IRO relationships.`,
    });
  }

  // Positive: full participation
  if (reviews.length >= 2 && participation.participation_rate === 100) {
    insights.push({
      severity: "positive",
      text: `100% child participation across all ${reviews.length} reviews. Children are actively shaping their care plans — strong evidence of Reg 22 compliance and child-centred practice.`,
    });
  }

  // Positive: high care plan update rate
  if (reviews.length >= 2 && overview.care_plan_update_rate === 100) {
    insights.push({
      severity: "positive",
      text: `Care plans updated at every review. This ensures children's evolving needs are captured and the placement can adapt to their changing circumstances.`,
    });
  }

  return {
    overview,
    child_profiles,
    action_compliance,
    participation,
    stability,
    alerts,
    insights,
  };
}
