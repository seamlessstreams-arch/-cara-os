// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CHILD LAC REVIEW INTELLIGENCE ENGINE
// Per-child engine analysing LAC review compliance, participation quality,
// action completion rates, care plan updates, IRO consistency, and
// review timeliness. Surfaces whether the statutory review process is
// driving positive outcomes for the child.
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
// Injectable `today` parameter for deterministic testing.
//
// Regulatory: CHR 2015 Reg 45 (independent person / IRO reviews),
// Reg 5 (placement plan). IRO Handbook. SCCIF: "Impact of leaders."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface LACReviewAction {
  action: string;
  owner: string;
  due_date: string;
  completed: boolean;
}

export interface LACReviewInput {
  id: string;
  date: string;
  review_type: string;               // initial, first_review, subsequent, emergency, disruption
  iro_name: string;
  child_participation: string;        // attended, views_submitted, advocate_attended, did_not_participate
  child_views_recorded: boolean;
  outcome: string;                    // placement_continues, placement_change, care_plan_amended, actions_agreed, return_home
  actions: LACReviewAction[];
  next_review_date: string | null;
  placement_stability: string;        // stable, some_concerns, at_risk
  care_plan_updated: boolean;
  attendee_count: number;
}

export interface ChildLACReviewInput {
  today: string;
  child_id: string;
  child_name: string;
  reviews: LACReviewInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type ReviewComplianceRating = "outstanding" | "good" | "adequate" | "inadequate" | "no_reviews";

export interface ReviewTimeliness {
  next_review_date: string | null;
  days_until_next: number | null;
  is_overdue: boolean;
  reviews_on_time_rate: number;       // % of reviews held within statutory timescales
}

export interface ParticipationProfile {
  attended_rate: number;
  views_submitted_rate: number;
  advocate_rate: number;
  did_not_participate_rate: number;
  views_recorded_rate: number;
}

export interface ActionCompletionProfile {
  total_actions: number;
  completed_count: number;
  completion_rate: number;
  overdue_count: number;
  overdue_actions: string[];           // action descriptions
}

export interface IROProfile {
  iro_names: string[];
  iro_consistency: boolean;            // same IRO for last 2+ reviews
  total_reviews: number;
}

export interface ReviewRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  domain: string;
  regulatory_ref: string;
}

export interface ReviewInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface ChildLACReviewResult {
  generated_at: string;
  child_id: string;
  child_name: string;
  compliance_rating: ReviewComplianceRating;
  compliance_score: number;             // 0-100
  headline: string;
  timeliness: ReviewTimeliness;
  participation: ParticipationProfile;
  action_completion: ActionCompletionProfile;
  iro: IROProfile;
  care_plan_update_rate: number;        // %
  placement_stability_current: string;
  strengths: string[];
  concerns: string[];
  recommendations: ReviewRecommendation[];
  insights: ReviewInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function daysAgo(today: string, date: string): number {
  return Math.round(
    (new Date(today).getTime() - new Date(date).getTime()) / 86_400_000,
  );
}

function daysUntil(today: string, date: string): number {
  return -daysAgo(today, date);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function pct(n: number, d: number): number {
  return d > 0 ? Math.round((n / d) * 100) : 0;
}

// ── Main Computation ────────────────────────────────────────────────────────

export function computeChildLACReview(
  input: ChildLACReviewInput,
): ChildLACReviewResult {
  const { today, child_id, child_name, reviews } = input;

  // Sort by date descending (most recent first)
  const sorted = [...reviews].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const mostRecent = sorted[0] ?? null;

  // ── Timeliness ───────────────────────────────────────────────────────
  const nextDate = mostRecent?.next_review_date ?? null;
  const daysUntilNext = nextDate ? daysUntil(today, nextDate) : null;
  const isOverdue = daysUntilNext !== null && daysUntilNext < 0;

  // Reviews on time: statutory timescales are 20 working days for first,
  // then 6 months. We approximate by checking inter-review gaps.
  // A review is "on time" if it occurs within 200 days of the previous one
  // (6 months + buffer), or within 30 days of placement for first review.
  let onTimeCount = 0;
  for (let i = 0; i < sorted.length; i++) {
    if (i === sorted.length - 1) {
      // First review — always considered on time if it exists
      onTimeCount++;
    } else {
      const gap = daysAgo(sorted[i].date, sorted[i + 1].date);
      if (gap <= 200) onTimeCount++;
    }
  }

  const timeliness: ReviewTimeliness = {
    next_review_date: nextDate,
    days_until_next: daysUntilNext,
    is_overdue: isOverdue,
    reviews_on_time_rate: pct(onTimeCount, reviews.length),
  };

  // ── Participation ────────────────────────────────────────────────────
  const attended = reviews.filter((r) => r.child_participation === "attended");
  const viewsSubmitted = reviews.filter((r) => r.child_participation === "views_submitted");
  const advocate = reviews.filter((r) => r.child_participation === "advocate_attended");
  const didNot = reviews.filter((r) => r.child_participation === "did_not_participate");
  const viewsRecorded = reviews.filter((r) => r.child_views_recorded);

  const participation: ParticipationProfile = {
    attended_rate: pct(attended.length, reviews.length),
    views_submitted_rate: pct(viewsSubmitted.length, reviews.length),
    advocate_rate: pct(advocate.length, reviews.length),
    did_not_participate_rate: pct(didNot.length, reviews.length),
    views_recorded_rate: pct(viewsRecorded.length, reviews.length),
  };

  // ── Action Completion ────────────────────────────────────────────────
  const allActions = reviews.flatMap((r) => r.actions);
  const completedActions = allActions.filter((a) => a.completed);
  const overdueActions = allActions.filter((a) => {
    if (a.completed) return false;
    const da = daysAgo(today, a.due_date);
    return da > 0;
  });

  const action_completion: ActionCompletionProfile = {
    total_actions: allActions.length,
    completed_count: completedActions.length,
    completion_rate: pct(completedActions.length, allActions.length),
    overdue_count: overdueActions.length,
    overdue_actions: overdueActions.map((a) => a.action),
  };

  // ── IRO Profile ──────────────────────────────────────────────────────
  const iroNames = [...new Set(reviews.map((r) => r.iro_name))];
  const lastTwoIROs = sorted.slice(0, 2).map((r) => r.iro_name);
  const iroConsistency = lastTwoIROs.length >= 2 ? lastTwoIROs[0] === lastTwoIROs[1] : true;

  const iro: IROProfile = {
    iro_names: iroNames,
    iro_consistency: iroConsistency,
    total_reviews: reviews.length,
  };

  // ── Care Plan Updates ────────────────────────────────────────────────
  const carePlanUpdated = reviews.filter((r) => r.care_plan_updated);
  const care_plan_update_rate = pct(carePlanUpdated.length, reviews.length);

  // ── Placement Stability ──────────────────────────────────────────────
  const placement_stability_current = mostRecent?.placement_stability ?? "unknown";

  // ── Compliance Score ─────────────────────────────────────────────────
  let score = 50;

  // Timeliness
  if (timeliness.reviews_on_time_rate === 100 && reviews.length >= 1) score += 10;
  else if (timeliness.reviews_on_time_rate < 50 && reviews.length >= 2) score -= 10;
  if (isOverdue) score -= 10;

  // Participation
  if (participation.attended_rate >= 80) score += 10;
  else if (participation.attended_rate >= 50) score += 5;
  if (participation.did_not_participate_rate > 50) score -= 10;
  if (participation.views_recorded_rate === 100 && reviews.length >= 1) score += 5;

  // Actions
  if (action_completion.completion_rate >= 80) score += 10;
  else if (action_completion.completion_rate >= 50) score += 3;
  if (action_completion.overdue_count > 0) score -= action_completion.overdue_count * 2;

  // Care plan
  if (care_plan_update_rate === 100 && reviews.length >= 1) score += 5;
  if (care_plan_update_rate < 50 && reviews.length >= 2) score -= 5;

  // IRO consistency
  if (iroConsistency && reviews.length >= 2) score += 3;
  if (!iroConsistency && reviews.length >= 2) score -= 3;

  // Stability
  if (placement_stability_current === "stable") score += 3;
  if (placement_stability_current === "at_risk") score -= 5;

  // Having reviews at all
  if (reviews.length === 0) score -= 15;

  score = clamp(score, 0, 100);

  const compliance_rating: ReviewComplianceRating =
    reviews.length === 0 ? "no_reviews" :
    score >= 80 ? "outstanding" :
    score >= 65 ? "good" :
    score >= 45 ? "adequate" :
    "inadequate";

  // ── Headline ──────────────────────────────────────────────────────────
  const parts: string[] = [];
  parts.push(`LAC review compliance: ${compliance_rating}`);
  if (reviews.length > 0) parts.push(`${reviews.length} review${reviews.length !== 1 ? "s" : ""}`);
  if (isOverdue && daysUntilNext !== null) parts.push(`OVERDUE by ${Math.abs(daysUntilNext)} days`);
  else if (daysUntilNext !== null && daysUntilNext <= 30) parts.push(`next review in ${daysUntilNext} days`);
  if (action_completion.overdue_count > 0) parts.push(`${action_completion.overdue_count} overdue action${action_completion.overdue_count !== 1 ? "s" : ""}`);
  const headline = parts.join(". ") + ".";

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];

  if (compliance_rating === "outstanding" || compliance_rating === "good") {
    strengths.push(`LAC review process rated ${compliance_rating} (${score}%). Reviews are timely, the child participates effectively, and actions are being completed. This evidences strong Reg 45 compliance.`);
  }

  if (participation.attended_rate >= 80 && reviews.length >= 2) {
    strengths.push(`${child_name} has attended ${participation.attended_rate}% of reviews. Direct participation demonstrates the child's voice is central to care planning — exactly what inspectors look for.`);
  }

  if (participation.views_recorded_rate === 100 && reviews.length >= 1) {
    strengths.push("Child views recorded in 100% of reviews. Whether attending or not, the child's perspective is consistently captured and evidenced.");
  }

  if (action_completion.completion_rate >= 80 && allActions.length >= 3) {
    strengths.push(`${action_completion.completion_rate}% of review actions completed. High action completion demonstrates that reviews drive real change, not just generate paperwork.`);
  }

  if (care_plan_update_rate === 100 && reviews.length >= 2) {
    strengths.push("Care plan updated after every review. This ensures the placement plan remains current and responsive to the child's evolving needs.");
  }

  if (iroConsistency && reviews.length >= 2) {
    strengths.push(`Consistent IRO (${iroNames[0] ?? "same IRO"}) across recent reviews. Continuity of IRO supports better relationship with the child and deeper understanding of their needs.`);
  }

  if (timeliness.reviews_on_time_rate === 100 && reviews.length >= 2) {
    strengths.push("All reviews held within statutory timescales. This demonstrates strong organisational compliance with LAC review requirements.");
  }

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];

  if (reviews.length === 0) {
    concerns.push("No LAC reviews recorded. Statutory reviews are a legal requirement — the IRO must review the care plan at prescribed intervals. This is a serious compliance gap.");
  }

  if (isOverdue && daysUntilNext !== null) {
    concerns.push(`Next review is overdue by ${Math.abs(daysUntilNext)} days. An overdue LAC review means the care plan has not been formally scrutinised within statutory timescales. Contact the IRO immediately.`);
  }

  if (participation.did_not_participate_rate > 0 && reviews.length >= 1) {
    concerns.push(`${child_name} did not participate in ${participation.did_not_participate_rate}% of reviews. Every effort must be made to include the child — through attendance, written views, advocates, or creative methods.`);
  }

  if (action_completion.overdue_count > 0) {
    concerns.push(`${action_completion.overdue_count} review action${action_completion.overdue_count !== 1 ? "s" : ""} overdue. Incomplete actions mean agreed changes are not being delivered. This undermines the review process and the child's progress.`);
  }

  if (care_plan_update_rate < 100 && reviews.length >= 2) {
    concerns.push(`Care plan updated after only ${care_plan_update_rate}% of reviews. The care plan should be updated after every review to reflect agreed changes and new actions.`);
  }

  if (!iroConsistency && reviews.length >= 2) {
    concerns.push("IRO has changed between reviews. While sometimes unavoidable, IRO consistency is important for maintaining a strong relationship with the child and ensuring oversight continuity.");
  }

  if (placement_stability_current === "at_risk") {
    concerns.push("Placement stability assessed as 'at risk' at the most recent review. An urgent disruption meeting should be considered to prevent placement breakdown.");
  }

  // ── Recommendations ───────────────────────────────────────────────────
  const recommendations: ReviewRecommendation[] = [];
  let rank = 0;

  if (isOverdue) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Contact the IRO immediately to schedule the overdue review. Provide an update on the child's progress to enable the IRO to prepare.",
      urgency: "immediate",
      domain: "compliance",
      regulatory_ref: "Reg 45",
    });
  }

  if (action_completion.overdue_count > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Complete or escalate the ${action_completion.overdue_count} overdue action${action_completion.overdue_count !== 1 ? "s" : ""}. If actions cannot be completed, contact the action owner and the IRO to agree a revised timeline.`,
      urgency: "soon",
      domain: "actions",
      regulatory_ref: "Reg 5",
    });
  }

  if (participation.did_not_participate_rate > 0 && reviews.length >= 1) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Explore creative ways to include ${child_name} in future reviews. Options include: attending part of the review, submitting written views, using an advocate, a pre-review meeting, or a child-friendly review format.`,
      urgency: "planned",
      domain: "participation",
      regulatory_ref: "Reg 45",
    });
  }

  if (placement_stability_current === "at_risk") {
    recommendations.push({
      rank: ++rank,
      recommendation: "Convene a disruption meeting with the social worker and IRO. Identify what is destabilising the placement and develop a targeted stability plan.",
      urgency: "immediate",
      domain: "stability",
      regulatory_ref: "Reg 5",
    });
  }

  if (reviews.length === 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Ensure the IRO is aware of this child and schedule the next review. For a new placement, the first review should be within 20 working days.",
      urgency: "immediate",
      domain: "compliance",
      regulatory_ref: "Reg 45",
    });
  }

  // ── ARIA Insights ─────────────────────────────────────────────────────
  const insights: ReviewInsight[] = [];

  if (compliance_rating === "inadequate") {
    insights.push({
      severity: "critical",
      text: `LAC review compliance is inadequate (${score}%). Ofsted will examine whether statutory reviews are happening on time, whether the child participates, and whether actions are being completed. The current position falls significantly below expectations.`,
    });
  }

  if (isOverdue && (daysUntilNext !== null && Math.abs(daysUntilNext) > 30)) {
    insights.push({
      severity: "critical",
      text: `The LAC review is significantly overdue (${Math.abs(daysUntilNext!)} days). This is a regulatory breach. The IRO Handbook is clear that reviews must happen within prescribed timescales — failure to do so means the child's care plan lacks independent oversight.`,
    });
  }

  if (compliance_rating === "outstanding") {
    insights.push({
      severity: "positive",
      text: `LAC review compliance is outstanding (${score}%). Reviews are timely, ${child_name} participates actively, actions are completed, and care plans are updated. This demonstrates that the statutory review process is working as intended — driving positive outcomes for the child.`,
    });
  }

  if (participation.attended_rate >= 80 && action_completion.completion_rate >= 80 && reviews.length >= 2) {
    insights.push({
      severity: "positive",
      text: `Strong child participation (${participation.attended_rate}% attendance) combined with high action completion (${action_completion.completion_rate}%) shows that reviews are meaningful, not just procedural. The child's voice is heard and acted upon.`,
    });
  }

  if (reviews.length >= 2 && timeliness.reviews_on_time_rate === 100 && care_plan_update_rate === 100) {
    insights.push({
      severity: "positive",
      text: "Exemplary review administration: all reviews timely, all care plans updated. This level of consistency ensures the child always has a current, reviewed care plan — fundamental to good care.",
    });
  }

  return {
    generated_at: today,
    child_id,
    child_name,
    compliance_rating,
    compliance_score: score,
    headline,
    timeliness,
    participation,
    action_completion,
    iro,
    care_plan_update_rate,
    placement_stability_current,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
