// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — OUTCOMES PROGRESS INTELLIGENCE ENGINE
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
// Analyses outcome targets, reviews, domain progress, and review compliance.
// Generates alerts and ARIA insights for stagnant/declining outcomes.
//
// Regulatory: Reg 7–14 (Individual care plans and outcomes for each child),
// SCCIF Overall Experiences & Progress of children & young people.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface ChildInput {
  id: string;
  name: string;
}

export type OutcomeDomain =
  | "health"
  | "education"
  | "emotional_wellbeing"
  | "identity"
  | "family_social"
  | "self_care"
  | "independence"
  | "behaviour";

export type OutcomeRating = 1 | 2 | 3 | 4 | 5;
export type OutcomeDirection = "improving" | "stable" | "declining";
export type OutcomeStatus = "active" | "achieved" | "on_hold" | "revised";

export interface OutcomeTargetInput {
  id: string;
  child_id: string;
  domain: OutcomeDomain;
  target_description: string;
  baseline_rating: OutcomeRating;
  current_rating: OutcomeRating;
  target_rating: OutcomeRating;
  direction: OutcomeDirection;
  status: OutcomeStatus;
  review_date: string; // ISO date — next review due
  set_date: string;    // ISO date — when target was first set
  yp_voice: string | null;
}

export interface OutcomeReviewInput {
  id: string;
  target_id: string;
  child_id: string;
  review_date: string; // ISO date — when review happened
  previous_rating: OutcomeRating;
  new_rating: OutcomeRating;
  direction: OutcomeDirection;
  yp_participated: boolean;
  yp_voice: string | null;
  progress_notes: string;
  barriers: string | null;
}

export interface OutcomesProgressInput {
  children: ChildInput[];
  targets: OutcomeTargetInput[];
  reviews: OutcomeReviewInput[];
  today?: string; // ISO date — injectable for deterministic tests
}

// ── Output Types ────────────────────────────────────────────────────────────

export interface OutcomesOverview {
  total_targets: number;
  active_targets: number;
  achieved_targets: number;
  on_hold_targets: number;
  revised_targets: number;
  improving_count: number;
  stable_count: number;
  declining_count: number;
  improving_pct: number;
  avg_progress_pct: number;
  total_children: number;
}

export interface DomainAnalysis {
  domain: OutcomeDomain;
  label: string;
  active_targets: number;
  achieved_targets: number;
  avg_progress_pct: number;
  improving_count: number;
  declining_count: number;
  stagnant_count: number;
}

export interface ChildOutcomeProfile {
  child_id: string;
  child_name: string;
  active_targets: number;
  achieved_targets: number;
  avg_progress_pct: number;
  improving_count: number;
  stable_count: number;
  declining_count: number;
  overall_direction: OutcomeDirection;
  strongest_domain: string | null;
  weakest_domain: string | null;
  reviews_overdue: number;
  yp_participation_rate: number; // 0-100
}

export interface ReviewCompliance {
  total_reviews_30d: number;
  total_reviews_90d: number;
  yp_participation_rate: number; // 0-100
  targets_overdue_review: number;
  avg_days_between_reviews: number;
}

export interface ProgressVelocity {
  targets_improved_30d: number;
  targets_declined_30d: number;
  targets_unchanged_30d: number;
  avg_rating_change_30d: number;
  targets_stagnant_90d: number;
}

export interface OutcomeAlert {
  severity: "critical" | "high" | "medium" | "low";
  message: string;
}

export interface AriaOutcomeInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface OutcomesProgressResult {
  overview: OutcomesOverview;
  domain_analysis: DomainAnalysis[];
  child_profiles: ChildOutcomeProfile[];
  review_compliance: ReviewCompliance;
  progress_velocity: ProgressVelocity;
  alerts: OutcomeAlert[];
  insights: AriaOutcomeInsight[];
}

// ── Domain Label Map ────────────────────────────────────────────────────────

const DOMAIN_LABELS: Record<OutcomeDomain, string> = {
  health: "Health",
  education: "Education",
  emotional_wellbeing: "Emotional Wellbeing",
  identity: "Identity & Self-Esteem",
  family_social: "Family & Social",
  self_care: "Self-Care Skills",
  independence: "Independence",
  behaviour: "Behaviour",
};

// ── Helpers ─────────────────────────────────────────────────────────────────

export function daysBetween(a: string, b: string): number {
  const msA = new Date(a).getTime();
  const msB = new Date(b).getTime();
  return Math.round(Math.abs(msB - msA) / 86_400_000);
}

/** Compute progress % of a target: 0–100 */
export function computeProgressPct(
  baseline: OutcomeRating,
  current: OutcomeRating,
  target: OutcomeRating,
): number {
  const range = target - baseline;
  if (range <= 0) return current >= target ? 100 : 0;
  const progress = current - baseline;
  const pct = Math.round((progress / range) * 100);
  return Math.max(0, Math.min(100, pct));
}

/** Get the most common value in an array, or null if empty */
export function majority<T>(arr: T[]): T | null {
  if (arr.length === 0) return null;
  const counts = new Map<T, number>();
  for (const v of arr) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best: T = arr[0];
  let bestCount = 0;
  for (const [k, c] of counts) {
    if (c > bestCount) { best = k; bestCount = c; }
  }
  return best;
}

/** Determine overall direction from counts */
export function overallDirection(
  improving: number,
  stable: number,
  declining: number,
): OutcomeDirection {
  if (declining > improving && declining > stable) return "declining";
  if (improving > declining) return "improving";
  return "stable";
}

/** Average of numbers, 0 if empty */
export function average(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

// ── Main Computation ────────────────────────────────────────────────────────

export function computeOutcomesProgress(input: OutcomesProgressInput): OutcomesProgressResult {
  const today = input.today ?? new Date().toISOString().slice(0, 10);
  const { children, targets, reviews } = input;

  // ── Overview ────────────────────────────────────────────────────────────
  const activeTargets = targets.filter((t) => t.status === "active");
  const achievedTargets = targets.filter((t) => t.status === "achieved");
  const onHoldTargets = targets.filter((t) => t.status === "on_hold");
  const revisedTargets = targets.filter((t) => t.status === "revised");

  const improvingTargets = activeTargets.filter((t) => t.direction === "improving");
  const stableTargets = activeTargets.filter((t) => t.direction === "stable");
  const decliningTargets = activeTargets.filter((t) => t.direction === "declining");

  const progressValues = activeTargets.map((t) =>
    computeProgressPct(t.baseline_rating, t.current_rating, t.target_rating),
  );

  const overview: OutcomesOverview = {
    total_targets: targets.length,
    active_targets: activeTargets.length,
    achieved_targets: achievedTargets.length,
    on_hold_targets: onHoldTargets.length,
    revised_targets: revisedTargets.length,
    improving_count: improvingTargets.length,
    stable_count: stableTargets.length,
    declining_count: decliningTargets.length,
    improving_pct: activeTargets.length > 0
      ? Math.round((improvingTargets.length / activeTargets.length) * 100)
      : 0,
    avg_progress_pct: Math.round(average(progressValues)),
    total_children: children.length,
  };

  // ── Domain Analysis ────────────────────────────────────────────────────
  const allDomains: OutcomeDomain[] = [
    "health", "education", "emotional_wellbeing", "identity",
    "family_social", "self_care", "independence", "behaviour",
  ];

  const domain_analysis: DomainAnalysis[] = allDomains
    .map((domain) => {
      const domainActive = activeTargets.filter((t) => t.domain === domain);
      const domainAchieved = achievedTargets.filter((t) => t.domain === domain);

      if (domainActive.length === 0 && domainAchieved.length === 0) return null;

      const progresses = domainActive.map((t) =>
        computeProgressPct(t.baseline_rating, t.current_rating, t.target_rating),
      );

      // Stagnant: active target with no rating change (current === baseline) and
      // set more than 90 days ago and direction is stable
      const stagnant = domainActive.filter((t) =>
        t.direction === "stable" &&
        t.current_rating === t.baseline_rating &&
        daysBetween(t.set_date, today) > 90,
      );

      return {
        domain,
        label: DOMAIN_LABELS[domain],
        active_targets: domainActive.length,
        achieved_targets: domainAchieved.length,
        avg_progress_pct: Math.round(average(progresses)),
        improving_count: domainActive.filter((t) => t.direction === "improving").length,
        declining_count: domainActive.filter((t) => t.direction === "declining").length,
        stagnant_count: stagnant.length,
      };
    })
    .filter((d): d is DomainAnalysis => d !== null);

  // ── Child Profiles ────────────────────────────────────────────────────
  const child_profiles: ChildOutcomeProfile[] = children.map((child) => {
    const childActive = activeTargets.filter((t) => t.child_id === child.id);
    const childAchieved = achievedTargets.filter((t) => t.child_id === child.id);
    const childReviews = reviews.filter((r) => r.child_id === child.id);

    const progresses = childActive.map((t) =>
      computeProgressPct(t.baseline_rating, t.current_rating, t.target_rating),
    );
    const improving = childActive.filter((t) => t.direction === "improving").length;
    const stable = childActive.filter((t) => t.direction === "stable").length;
    const declining = childActive.filter((t) => t.direction === "declining").length;

    // Strongest/weakest domain by avg progress
    const domainProgresses = new Map<OutcomeDomain, number[]>();
    for (const t of childActive) {
      const pct = computeProgressPct(t.baseline_rating, t.current_rating, t.target_rating);
      if (!domainProgresses.has(t.domain)) domainProgresses.set(t.domain, []);
      domainProgresses.get(t.domain)!.push(pct);
    }
    let strongest: string | null = null;
    let weakest: string | null = null;
    let highestAvg = -1;
    let lowestAvg = 101;
    for (const [domain, pcts] of domainProgresses) {
      const avg = average(pcts);
      if (avg > highestAvg) { highestAvg = avg; strongest = DOMAIN_LABELS[domain]; }
      if (avg < lowestAvg) { lowestAvg = avg; weakest = DOMAIN_LABELS[domain]; }
    }
    // If only one domain, weakest = strongest — clear weakest
    if (strongest && weakest && strongest === weakest) weakest = null;

    // Reviews overdue for this child
    const overdueCount = childActive.filter((t) => t.review_date < today).length;

    // YP participation in reviews for this child
    const ypRate = childReviews.length > 0
      ? Math.round((childReviews.filter((r) => r.yp_participated).length / childReviews.length) * 100)
      : 0;

    return {
      child_id: child.id,
      child_name: child.name,
      active_targets: childActive.length,
      achieved_targets: childAchieved.length,
      avg_progress_pct: Math.round(average(progresses)),
      improving_count: improving,
      stable_count: stable,
      declining_count: declining,
      overall_direction: overallDirection(improving, stable, declining),
      strongest_domain: strongest,
      weakest_domain: weakest,
      reviews_overdue: overdueCount,
      yp_participation_rate: ypRate,
    };
  });

  // ── Review Compliance ─────────────────────────────────────────────────
  const reviews30d = reviews.filter((r) => daysBetween(r.review_date, today) <= 30);
  const reviews90d = reviews.filter((r) => daysBetween(r.review_date, today) <= 90);
  const targetsOverdue = activeTargets.filter((t) => t.review_date < today).length;

  // Average days between consecutive reviews per target
  const reviewIntervals: number[] = [];
  const targetReviewMap = new Map<string, string[]>();
  for (const r of reviews) {
    if (!targetReviewMap.has(r.target_id)) targetReviewMap.set(r.target_id, []);
    targetReviewMap.get(r.target_id)!.push(r.review_date);
  }
  for (const dates of targetReviewMap.values()) {
    if (dates.length < 2) continue;
    const sorted = [...dates].sort();
    for (let i = 1; i < sorted.length; i++) {
      reviewIntervals.push(daysBetween(sorted[i - 1], sorted[i]));
    }
  }

  const review_compliance: ReviewCompliance = {
    total_reviews_30d: reviews30d.length,
    total_reviews_90d: reviews90d.length,
    yp_participation_rate: reviews.length > 0
      ? Math.round((reviews.filter((r) => r.yp_participated).length / reviews.length) * 100)
      : 0,
    targets_overdue_review: targetsOverdue,
    avg_days_between_reviews: Math.round(average(reviewIntervals)),
  };

  // ── Progress Velocity ──────────────────────────────────────────────────
  const improved30d = reviews30d.filter((r) => r.new_rating > r.previous_rating);
  const declined30d = reviews30d.filter((r) => r.new_rating < r.previous_rating);
  const unchanged30d = reviews30d.filter((r) => r.new_rating === r.previous_rating);

  const ratingChanges30d = reviews30d.map((r) => r.new_rating - r.previous_rating);

  // Stagnant 90d: active targets with direction stable, current === baseline,
  // and set > 90 days ago
  const stagnant90d = activeTargets.filter((t) =>
    t.direction === "stable" &&
    t.current_rating === t.baseline_rating &&
    daysBetween(t.set_date, today) > 90,
  );

  const progress_velocity: ProgressVelocity = {
    targets_improved_30d: improved30d.length,
    targets_declined_30d: declined30d.length,
    targets_unchanged_30d: unchanged30d.length,
    avg_rating_change_30d: ratingChanges30d.length > 0
      ? Math.round(average(ratingChanges30d) * 100) / 100
      : 0,
    targets_stagnant_90d: stagnant90d.length,
  };

  // ── Alerts ─────────────────────────────────────────────────────────────
  const alerts: OutcomeAlert[] = [];

  // Critical: child declining in 2+ domains
  for (const profile of child_profiles) {
    if (profile.declining_count >= 2) {
      alerts.push({
        severity: "critical",
        message: `${profile.child_name} is declining in ${profile.declining_count} outcome areas — urgent review recommended`,
      });
    }
  }

  // High: targets stagnant for 90+ days
  if (stagnant90d.length > 0) {
    alerts.push({
      severity: "high",
      message: `${stagnant90d.length} target${stagnant90d.length > 1 ? "s" : ""} stagnant for 90+ days with no progress from baseline`,
    });
  }

  // Medium: reviews overdue
  if (targetsOverdue > 0) {
    alerts.push({
      severity: "medium",
      message: `${targetsOverdue} outcome review${targetsOverdue > 1 ? "s" : ""} overdue — schedule promptly`,
    });
  }

  // Medium: declining targets
  if (decliningTargets.length > 0) {
    alerts.push({
      severity: "medium",
      message: `${decliningTargets.length} active target${decliningTargets.length > 1 ? "s" : ""} currently declining — review care plan`,
    });
  }

  // Low: YP participation below 80%
  if (reviews.length >= 3 && review_compliance.yp_participation_rate < 80) {
    alerts.push({
      severity: "low",
      message: `Young person participation rate is ${review_compliance.yp_participation_rate}% — ensure voice of the child is captured`,
    });
  }

  // ── ARIA Insights ─────────────────────────────────────────────────────
  const insights: AriaOutcomeInsight[] = [];

  // Critical: any child with declining outcomes and no recent review
  for (const profile of child_profiles) {
    if (profile.declining_count > 0 && profile.reviews_overdue > 0) {
      insights.push({
        severity: "critical",
        text: `${profile.child_name} has ${profile.declining_count} declining outcome${profile.declining_count > 1 ? "s" : ""} with ${profile.reviews_overdue} overdue review${profile.reviews_overdue > 0 ? "s" : ""}. Prioritise multi-agency review and update care plan targets.`,
      });
    }
  }

  // Warning: domain with 0% progress
  for (const da of domain_analysis) {
    if (da.active_targets >= 2 && da.avg_progress_pct === 0) {
      insights.push({
        severity: "warning",
        text: `${da.label} domain shows 0% progress across ${da.active_targets} active targets. Consider if targets are realistic or if additional support is needed.`,
      });
    }
  }

  // Warning: stagnant targets
  if (stagnant90d.length > 0) {
    const stagnantChildren = new Set(stagnant90d.map((t) => t.child_id));
    insights.push({
      severity: "warning",
      text: `${stagnant90d.length} target${stagnant90d.length > 1 ? "s" : ""} across ${stagnantChildren.size} child${stagnantChildren.size > 1 ? "ren" : ""} show${stagnant90d.length === 1 ? "s" : ""} no progress from baseline after 90+ days. Review whether targets need revising or additional interventions are required.`,
    });
  }

  // Positive: overall improving majority
  if (overview.improving_pct >= 50 && activeTargets.length >= 3) {
    insights.push({
      severity: "positive",
      text: `${overview.improving_pct}% of active targets are improving. ${achievedTargets.length > 0 ? `${achievedTargets.length} target${achievedTargets.length > 1 ? "s" : ""} achieved. ` : ""}Positive outcomes trajectory — continue current approaches and celebrate progress with young people.`,
    });
  }

  // Positive: high YP participation
  if (reviews.length >= 3 && review_compliance.yp_participation_rate >= 90) {
    insights.push({
      severity: "positive",
      text: `Young person participation in outcome reviews is ${review_compliance.yp_participation_rate}%. Excellent practice — voices of children are being heard and documented.`,
    });
  }

  return {
    overview,
    domain_analysis,
    child_profiles,
    review_compliance,
    progress_velocity,
    alerts,
    insights,
  };
}
