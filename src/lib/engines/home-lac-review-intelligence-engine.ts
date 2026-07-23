// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME LAC REVIEW INTELLIGENCE ENGINE
// Home-level: synthesises LAC (Looked After Child) review data across all
// children to produce an overall review compliance, child participation, action
// tracking, and placement stability intelligence.
// CHR 2015 Reg 36. SCCIF: "Experiences and progress", "Overall experiences."
// ══════════════════════════════════════════════════════════════════════════════

import { below, formatRate, meets, rate, rateOf } from "@/lib/metrics/rate";

// ── Input Types ─────────────────────────────────────────────────────────────

export interface LACReviewActionInput {
  completed: boolean;
  due_date: string;                        // YYYY-MM-DD
}

export interface LACReviewInput {
  id: string;
  child_id: string;
  date: string;                            // YYYY-MM-DD
  review_type: string;                     // "first_review" | "subsequent"
  child_participation: string;             // "attended" | "views_submitted" | "advocate" | "none"
  has_child_views: boolean;
  attendee_count: number;
  has_social_worker: boolean;
  has_iro: boolean;
  outcome: string;                         // "placement_continues" | "care_plan_amended" | "placement_change" | etc.
  actions_agreed: LACReviewActionInput[];
  care_plan_updated: boolean;
  placement_stability: string;             // "stable" | "some_concerns" | "unstable"
  next_review_date: string | null;
}

export interface HomeLACReviewInput {
  today: string;
  total_children: number;
  child_ids: string[];
  lac_reviews: LACReviewInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type LACReviewRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface ReviewComplianceProfile {
  total_reviews_180d: number;
  reviews_per_child: number;
  children_with_reviews: string[];
  children_without_reviews: string[];
  first_reviews: number;
  subsequent_reviews: number;
  care_plan_update_rate: number | null;   // null = no review recorded           // % with care plan updated
  overdue_reviews: string[];               // child IDs with overdue next_review_date
}

export interface ParticipationProfile {
  attended_rate: number | null;            // % where child attended or submitted views
  views_rate: number | null;               // % with child views documented
  advocate_count: number;
  no_participation_count: number;
}

export interface ActionProfile {
  total_actions: number;
  completed_actions: number;
  completion_rate: number | null;          // null = no action was agreed at review
  overdue_actions: number;
}

export interface StabilityProfile {
  stable_count: number;
  some_concerns_count: number;
  unstable_count: number;
  stability_rate: number | null;           // % stable; null = no review to draw on
}

export interface LACReviewInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface LACReviewRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface HomeLACReviewResult {
  lac_review_rating: LACReviewRating;
  lac_review_score: number;
  headline: string;
  compliance: ReviewComplianceProfile;
  participation: ParticipationProfile;
  actions: ActionProfile;
  stability: StabilityProfile;
  strengths: string[];
  concerns: string[];
  recommendations: LACReviewRecommendation[];
  insights: LACReviewInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): LACReviewRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeHomeLACReview(
  input: HomeLACReviewInput,
): HomeLACReviewResult {
  const { today, total_children, child_ids, lac_reviews } = input;

  // Insufficient data
  if (lac_reviews.length === 0) {
    const overdueChildren = total_children > 0 ? child_ids : [];
    return {
      lac_review_rating: "insufficient_data",
      lac_review_score: 0,
      headline: "No LAC reviews recorded — every looked after child must have regular statutory reviews.",
      compliance: emptyCompliance(overdueChildren),
      participation: emptyParticipation(),
      actions: emptyActions(),
      stability: emptyStability(),
      strengths: [],
      concerns: ["No LAC reviews recorded — this is a regulatory requirement under Reg 36."],
      recommendations: [{ rank: 1, recommendation: "Schedule LAC reviews for all children immediately — this is a statutory requirement.", urgency: "immediate", regulatory_ref: "Reg 36" }],
      insights: [{ text: "Ofsted expects every looked after child to have regular statutory reviews. Without any reviews documented, the home cannot evidence compliance.", severity: "critical" }],
    };
  }

  // ── Reviews within 180d ───────────────────────────────────────────────
  const revs180d = lac_reviews.filter(r => {
    const d = daysBetween(r.date, today);
    return d >= 0 && d <= 180;
  });

  // If all reviews are outside 180d, use them anyway but note it
  const workingReviews = revs180d.length > 0 ? revs180d : lac_reviews;

  // ── Compliance Profile ────────────────────────────────────────────────
  const childrenWithReviews = [...new Set(workingReviews.map(r => r.child_id))];
  const childrenWithoutReviews = child_ids.filter(id => !childrenWithReviews.includes(id));
  const firstReviews = workingReviews.filter(r => r.review_type === "first_review").length;
  const subsequentReviews = workingReviews.filter(r => r.review_type === "subsequent").length;
  const carePlanUpdated = workingReviews.filter(r => r.care_plan_updated).length;
  const carePlanRate = rate(carePlanUpdated, workingReviews.length);

  // Overdue reviews: children whose most recent review has next_review_date < today
  const overdueReviews: string[] = [];
  for (const childId of childrenWithReviews) {
    const childRevs = workingReviews
      .filter(r => r.child_id === childId)
      .sort((a, b) => b.date.localeCompare(a.date));
    const latest = childRevs[0];
    if (latest?.next_review_date && latest.next_review_date < today) {
      overdueReviews.push(childId);
    }
  }
  // Children with no reviews at all are also effectively overdue
  for (const childId of childrenWithoutReviews) {
    overdueReviews.push(childId);
  }

  const reviewsPerChild = total_children > 0
    ? Math.round((workingReviews.length / total_children) * 10) / 10
    : 0;

  const complianceProfile: ReviewComplianceProfile = {
    total_reviews_180d: revs180d.length,
    reviews_per_child: reviewsPerChild,
    children_with_reviews: childrenWithReviews,
    children_without_reviews: childrenWithoutReviews,
    first_reviews: firstReviews,
    subsequent_reviews: subsequentReviews,
    care_plan_update_rate: carePlanRate,
    overdue_reviews: overdueReviews,
  };

  // ── Participation Profile ─────────────────────────────────────────────
  const attended = workingReviews.filter(r =>
    r.child_participation === "attended" || r.child_participation === "views_submitted"
  ).length;
  const attendedRate = rate(attended, workingReviews.length);

  const withViews = workingReviews.filter(r => r.has_child_views).length;
  const viewsRate = rate(withViews, workingReviews.length);

  const advocateCount = workingReviews.filter(r => r.child_participation === "advocate").length;
  const noParticipation = workingReviews.filter(r => r.child_participation === "none").length;

  const participationProfile: ParticipationProfile = {
    attended_rate: attendedRate,
    views_rate: viewsRate,
    advocate_count: advocateCount,
    no_participation_count: noParticipation,
  };

  // ── Action Profile ────────────────────────────────────────────────────
  const allActions = workingReviews.flatMap(r => r.actions_agreed);
  const completedActions = allActions.filter(a => a.completed).length;
  // Null when no action was agreed at any review — nothing to follow through on
  const actionCompletionRate = rate(completedActions, allActions.length);
  const overdueActions = allActions.filter(a => !a.completed && a.due_date < today).length;

  const actionProfile: ActionProfile = {
    total_actions: allActions.length,
    completed_actions: completedActions,
    completion_rate: actionCompletionRate,
    overdue_actions: overdueActions,
  };

  // ── Stability Profile ─────────────────────────────────────────────────
  // Use most recent review per child
  const latestPerChild: LACReviewInput[] = [];
  for (const childId of childrenWithReviews) {
    const childRevs = workingReviews
      .filter(r => r.child_id === childId)
      .sort((a, b) => b.date.localeCompare(a.date));
    if (childRevs[0]) latestPerChild.push(childRevs[0]);
  }

  const stableCount = latestPerChild.filter(r => r.placement_stability === "stable").length;
  const someConcerns = latestPerChild.filter(r => r.placement_stability === "some_concerns").length;
  const unstableCount = latestPerChild.filter(r => r.placement_stability === "unstable").length;
  const stabilityRate = rate(stableCount, latestPerChild.length);

  const stabilityProfile: StabilityProfile = {
    stable_count: stableCount,
    some_concerns_count: someConcerns,
    unstable_count: unstableCount,
    stability_rate: stabilityRate,
  };

  // ── Scoring ───────────────────────────────────────────────────────────
  let score = 50;

  // Review coverage (±12)
  if (childrenWithoutReviews.length === 0 && total_children > 0) score += 8;
  else if (childrenWithoutReviews.length >= 2) score -= 10;
  else if (childrenWithoutReviews.length === 1) score -= 4;

  // Overdue reviews (±8)
  if (overdueReviews.length === 0) score += 4;
  else if (overdueReviews.length >= 2) score -= 6;
  else score -= 3;

  // Child participation (±10)
  if (meets(attendedRate, 100)) score += 6;
  else if (meets(attendedRate, 80)) score += 3;
  else if (below(attendedRate, 50)) score -= 5;

  // Child views (±6)
  if (meets(viewsRate, 100)) score += 4;
  else if (meets(viewsRate, 80)) score += 2;
  else if (below(viewsRate, 50)) score -= 4;

  // No participation is a concern
  if (noParticipation > 0) score -= 4;

  // Care plan updates (±6)
  if (meets(carePlanRate, 100)) score += 4;
  else if (below(carePlanRate, 80)) score -= 4;

  // Action completion (±8)
  if (meets(actionCompletionRate, 80)) score += 4;
  else if (below(actionCompletionRate, 50)) score -= 5;

  // Overdue actions
  if (overdueActions >= 3) score -= 4;
  else if (overdueActions >= 1) score -= 2;

  // Placement stability (±8)
  if (meets(stabilityRate, 100)) score += 5;
  else if (unstableCount > 0) score -= 5;
  else if (someConcerns > 0) score -= 2;

  // Professional attendance
  const allHaveSW = workingReviews.every(r => r.has_social_worker);
  const allHaveIRO = workingReviews.every(r => r.has_iro);
  if (allHaveSW && allHaveIRO) score += 3;
  else if (!allHaveIRO) score -= 3;

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (childrenWithoutReviews.length === 0 && total_children > 0) strengths.push("All children have documented LAC reviews — statutory compliance evidenced.");
  if (meets(attendedRate, 100)) strengths.push("100% child participation in LAC reviews — every child attended or submitted views.");
  if (meets(viewsRate, 100)) strengths.push("Child views documented in every review — excellent practice in capturing the child's voice.");
  if (meets(carePlanRate, 100)) strengths.push("Care plans updated after every review — proactive care planning evidenced.");
  if (meets(actionCompletionRate, 80)) strengths.push(`${formatRate(actionCompletionRate)} action completion rate — strong follow-through on review decisions.`);
  if (meets(stabilityRate, 100)) strengths.push("All placements rated as stable — children are settled and secure.");
  if (allHaveSW && allHaveIRO && workingReviews.length > 0) strengths.push("Social worker and IRO attended all reviews — strong multi-agency engagement.");

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (childrenWithoutReviews.length > 0) concerns.push(`${childrenWithoutReviews.length} child${childrenWithoutReviews.length > 1 ? "ren" : ""} without LAC reviews — this is a regulatory requirement.`);
  if (overdueReviews.length > 0) concerns.push(`${overdueReviews.length} child${overdueReviews.length > 1 ? "ren have" : " has"} overdue LAC reviews — reviews must be held within statutory timescales.`);
  if (noParticipation > 0) concerns.push(`${noParticipation} review${noParticipation > 1 ? "s" : ""} with no child participation — the child must be supported to contribute.`);
  if (overdueActions > 0) concerns.push(`${overdueActions} overdue review action${overdueActions > 1 ? "s" : ""} — these require urgent attention.`);
  if (unstableCount > 0) concerns.push(`${unstableCount} placement${unstableCount > 1 ? "s" : ""} rated as unstable — urgent stability planning needed.`);
  if (below(carePlanRate, 100)) concerns.push(`Care plan updated in only ${formatRate(carePlanRate)} of reviews — plans must be updated after every review.`);
  if (below(actionCompletionRate, 50)) concerns.push(`Only ${formatRate(actionCompletionRate)} of review actions completed — this undermines the value of the review process.`);

  // ── Recommendations ───────────────────────────────────────────────────
  const recs: LACReviewRecommendation[] = [];
  let rank = 1;

  if (childrenWithoutReviews.length > 0) {
    recs.push({ rank: rank++, recommendation: "Schedule LAC reviews for children without recent reviews — ensure statutory compliance.", urgency: "immediate", regulatory_ref: "Reg 36" });
  }
  if (overdueReviews.length > 0) {
    recs.push({ rank: rank++, recommendation: "Address overdue LAC reviews — reviews must not exceed statutory timescales.", urgency: "immediate", regulatory_ref: "Reg 36" });
  }
  if (noParticipation > 0) {
    recs.push({ rank: rank++, recommendation: "Develop strategies to support child participation in reviews — consider advocates or creative methods.", urgency: "soon", regulatory_ref: "Reg 7" });
  }
  if (overdueActions >= 2) {
    recs.push({ rank: rank++, recommendation: "Review and progress all overdue review actions — track completion in supervision.", urgency: "soon", regulatory_ref: "Reg 36" });
  }
  if (unstableCount > 0) {
    recs.push({ rank: rank++, recommendation: "Convene stability meetings for children with unstable placements — identify and address root causes.", urgency: "immediate", regulatory_ref: "Reg 36" });
  }
  if (below(carePlanRate, 100)) {
    recs.push({ rank: rank++, recommendation: "Ensure care plans are updated after every review — document changes and circulate.", urgency: "planned", regulatory_ref: "Reg 36" });
  }

  // ── Insights ──────────────────────────────────────────────────────────
  const insights: LACReviewInsight[] = [];

  if (childrenWithoutReviews.length > 0) {
    insights.push({ text: `${childrenWithoutReviews.length} child${childrenWithoutReviews.length > 1 ? "ren" : ""} without LAC reviews. Ofsted will view this as a fundamental failure to meet statutory requirements under Regulation 36.`, severity: "critical" });
  }
  if (unstableCount > 0) {
    insights.push({ text: `${unstableCount} placement${unstableCount > 1 ? "s" : ""} rated as unstable. Placement breakdowns damage children and Ofsted will assess the home's response strategy.`, severity: "critical" });
  }
  if (noParticipation > 0) {
    insights.push({ text: `${noParticipation} review${noParticipation > 1 ? "s" : ""} with no child participation. Ofsted places significant weight on the child's voice in reviews — this must be addressed.`, severity: "warning" });
  }
  if (meets(attendedRate, 100) && meets(viewsRate, 100)) {
    insights.push({ text: "Excellent child participation: every child either attended their review or submitted views, with views documented in every case. This evidences outstanding child-centred practice.", severity: "positive" });
  }
  if (meets(stabilityRate, 100)) {
    insights.push({ text: "All placements are stable. This evidences effective matching, planning, and responsive care.", severity: "positive" });
  }
  if (meets(actionCompletionRate, 80) && allActions.length >= 3) {
    insights.push({ text: `Strong action follow-through at ${formatRate(actionCompletionRate)}. This shows the home takes review recommendations seriously and acts on them.`, severity: "positive" });
  }
  if (overdueActions === 0 && allActions.length > 0) {
    insights.push({ text: "No overdue review actions — all agreed actions are being progressed within timescales.", severity: "positive" });
  }

  // ── Headline ──────────────────────────────────────────────────────────
  let headline: string;
  if (rating === "outstanding") {
    headline = "Outstanding LAC review compliance — full coverage, strong child participation, and excellent action follow-through.";
  } else if (rating === "good") {
    headline = `Good LAC review practice — ${workingReviews.length} reviews with ${formatRate(attendedRate)} child participation and ${formatRate(actionCompletionRate, "no")} action completion.`;
  } else if (rating === "adequate") {
    headline = "Adequate LAC review compliance — improvements needed in coverage, participation, or action tracking.";
  } else {
    headline = "LAC review compliance is inadequate — statutory requirements are not being met.";
  }

  return {
    lac_review_rating: rating,
    lac_review_score: score,
    headline,
    compliance: complianceProfile,
    participation: participationProfile,
    actions: actionProfile,
    stability: stabilityProfile,
    strengths,
    concerns,
    recommendations: recs,
    insights,
  };
}

// ── Empty Defaults ──────────────────────────────────────────────────────────

function emptyCompliance(overdue: string[] = []): ReviewComplianceProfile {
  return {
    total_reviews_180d: 0, reviews_per_child: 0,
    children_with_reviews: [], children_without_reviews: overdue,
    first_reviews: 0, subsequent_reviews: 0,
    care_plan_update_rate: null, overdue_reviews: overdue,
  };
}

function emptyParticipation(): ParticipationProfile {
  return { attended_rate: null, views_rate: null, advocate_count: 0, no_participation_count: 0 };
}

function emptyActions(): ActionProfile {
  return { total_actions: 0, completed_actions: 0, completion_rate: null, overdue_actions: 0 };
}

function emptyStability(): StabilityProfile {
  return { stable_count: 0, some_concerns_count: 0, unstable_count: 0, stability_rate: null };
}
