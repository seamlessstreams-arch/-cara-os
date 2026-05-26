// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CHILD OUTCOME INTELLIGENCE ENGINE
// Per-child engine analysing outcome targets across all 8 domains,
// progress tracking, review compliance, YP participation, barriers,
// and whether outcomes are translating into real change for the child.
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
// Injectable `today` parameter for deterministic testing.
//
// Regulatory: CHR 2015 Reg 5 (placement plan), Reg 6 (quality of care),
// Reg 13 (promoting independence). SCCIF: "Progress and outcomes."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

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
  domain: OutcomeDomain;
  target_description: string;
  success_criteria: string;
  baseline_rating: OutcomeRating;
  current_rating: OutcomeRating;
  target_rating: OutcomeRating;
  direction: OutcomeDirection;
  status: OutcomeStatus;
  review_date: string;
  set_date: string;
  yp_voice: string | null;
}

export interface OutcomeReviewInput {
  id: string;
  target_id: string;
  review_date: string;
  previous_rating: OutcomeRating;
  new_rating: OutcomeRating;
  direction: OutcomeDirection;
  yp_participated: boolean;
  yp_voice: string | null;
  barriers: string | null;
  next_steps: string | null;
}

export interface ChildOutcomeInput {
  today: string;
  child_id: string;
  child_name: string;
  targets: OutcomeTargetInput[];
  reviews: OutcomeReviewInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type OutcomeProgressRating = "outstanding" | "good" | "adequate" | "inadequate" | "no_targets";

export interface DomainProfile {
  domain: OutcomeDomain;
  domain_label: string;
  target_count: number;
  avg_current_rating: number;
  avg_baseline_rating: number;
  avg_target_rating: number;
  progress_gap: number;           // current - baseline (positive = progress)
  remaining_gap: number;          // target - current (positive = still to go)
  improving_count: number;
  stable_count: number;
  declining_count: number;
  achieved_count: number;
  has_declining: boolean;
}

export interface ReviewCompliance {
  total_reviews: number;
  reviews_with_yp: number;
  yp_participation_rate: number;  // %
  reviews_with_barriers: number;
  overdue_reviews: number;        // targets past review_date without recent review
  avg_days_between_reviews: number | null;
}

export interface ProgressSummary {
  total_targets: number;
  active_targets: number;
  achieved_targets: number;
  on_hold_targets: number;
  improving_count: number;
  stable_count: number;
  declining_count: number;
  avg_progress: number;           // avg (current - baseline) across active targets
  targets_with_yp_voice: number;
  yp_voice_rate: number;          // % of targets with child's voice captured
}

export interface OutcomeRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  domain: string;
  regulatory_ref: string;
}

export interface OutcomeInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface ChildOutcomeResult {
  generated_at: string;
  child_id: string;
  child_name: string;
  progress_rating: OutcomeProgressRating;
  progress_score: number;           // 0-100
  headline: string;
  progress_summary: ProgressSummary;
  domain_profiles: DomainProfile[];
  review_compliance: ReviewCompliance;
  strengths: string[];
  concerns: string[];
  recommendations: OutcomeRecommendation[];
  insights: OutcomeInsight[];
}

// ── Constants ──────────────────────────────────────────────────────────────

const DOMAIN_LABELS: Record<OutcomeDomain, string> = {
  health:               "Health",
  education:            "Education",
  emotional_wellbeing:  "Emotional Wellbeing",
  identity:             "Identity & Self-Esteem",
  family_social:        "Family & Social Relationships",
  self_care:            "Self-Care Skills",
  independence:         "Independence & Life Skills",
  behaviour:            "Behaviour & Boundaries",
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function daysAgo(today: string, date: string): number {
  return Math.round(
    (new Date(today).getTime() - new Date(date).getTime()) / 86_400_000,
  );
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function pct(n: number, d: number): number {
  return d > 0 ? Math.round((n / d) * 100) : 0;
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

// ── Main Computation ────────────────────────────────────────────────────────

export function computeChildOutcome(
  input: ChildOutcomeInput,
): ChildOutcomeResult {
  const { today, child_id, child_name, targets, reviews } = input;

  const activeTargets = targets.filter((t) => t.status === "active");
  const achievedTargets = targets.filter((t) => t.status === "achieved");
  const onHoldTargets = targets.filter((t) => t.status === "on_hold");

  // ── Progress Summary ──────────────────────────────────────────────────
  const improvingActive = activeTargets.filter((t) => t.direction === "improving");
  const stableActive = activeTargets.filter((t) => t.direction === "stable");
  const decliningActive = activeTargets.filter((t) => t.direction === "declining");

  const progressValues = activeTargets.map((t) => t.current_rating - t.baseline_rating);
  const avgProgress = avg(progressValues);

  const targetsWithVoice = targets.filter((t) => t.yp_voice && t.yp_voice.trim().length > 0);

  const progress_summary: ProgressSummary = {
    total_targets: targets.length,
    active_targets: activeTargets.length,
    achieved_targets: achievedTargets.length,
    on_hold_targets: onHoldTargets.length,
    improving_count: improvingActive.length,
    stable_count: stableActive.length,
    declining_count: decliningActive.length,
    avg_progress: avgProgress,
    targets_with_yp_voice: targetsWithVoice.length,
    yp_voice_rate: pct(targetsWithVoice.length, targets.length),
  };

  // ── Domain Profiles ───────────────────────────────────────────────────
  const domains = Object.keys(DOMAIN_LABELS) as OutcomeDomain[];
  const domain_profiles: DomainProfile[] = domains
    .map((domain) => {
      const domainTargets = targets.filter((t) => t.domain === domain);
      if (domainTargets.length === 0) return null;

      const currentRatings = domainTargets.map((t) => t.current_rating);
      const baselineRatings = domainTargets.map((t) => t.baseline_rating);
      const targetRatings = domainTargets.map((t) => t.target_rating);

      const activeInDomain = domainTargets.filter((t) => t.status === "active");

      return {
        domain,
        domain_label: DOMAIN_LABELS[domain],
        target_count: domainTargets.length,
        avg_current_rating: avg(currentRatings),
        avg_baseline_rating: avg(baselineRatings),
        avg_target_rating: avg(targetRatings),
        progress_gap: avg(domainTargets.map((t) => t.current_rating - t.baseline_rating)),
        remaining_gap: avg(domainTargets.map((t) => t.target_rating - t.current_rating)),
        improving_count: activeInDomain.filter((t) => t.direction === "improving").length,
        stable_count: activeInDomain.filter((t) => t.direction === "stable").length,
        declining_count: activeInDomain.filter((t) => t.direction === "declining").length,
        achieved_count: domainTargets.filter((t) => t.status === "achieved").length,
        has_declining: activeInDomain.some((t) => t.direction === "declining"),
      };
    })
    .filter((p): p is DomainProfile => p !== null);

  // ── Review Compliance ─────────────────────────────────────────────────
  const reviewsWithYP = reviews.filter((r) => r.yp_participated);
  const reviewsWithBarriers = reviews.filter((r) => r.barriers && r.barriers.trim().length > 0);

  // Overdue reviews: active targets where review_date is in the past
  const overdueTargets = activeTargets.filter((t) => {
    const da = daysAgo(today, t.review_date);
    return da > 0;
  });

  // Average days between reviews per target
  const targetReviewGaps: number[] = [];
  for (const target of targets) {
    const targetReviews = reviews
      .filter((r) => r.target_id === target.id)
      .sort((a, b) => new Date(a.review_date).getTime() - new Date(b.review_date).getTime());

    for (let i = 1; i < targetReviews.length; i++) {
      const gap = daysAgo(targetReviews[i].review_date, targetReviews[i - 1].review_date);
      if (gap > 0) targetReviewGaps.push(gap);
    }
  }

  const review_compliance: ReviewCompliance = {
    total_reviews: reviews.length,
    reviews_with_yp: reviewsWithYP.length,
    yp_participation_rate: pct(reviewsWithYP.length, reviews.length),
    reviews_with_barriers: reviewsWithBarriers.length,
    overdue_reviews: overdueTargets.length,
    avg_days_between_reviews: targetReviewGaps.length > 0 ? Math.round(avg(targetReviewGaps)) : null,
  };

  // ── Score ─────────────────────────────────────────────────────────────
  let score = 50;

  if (targets.length === 0) {
    score = 0;
  } else {
    // Progress direction weighting
    const improvingRate = pct(improvingActive.length, activeTargets.length);
    const decliningRate = pct(decliningActive.length, activeTargets.length);

    if (improvingRate >= 70) score += 15;
    else if (improvingRate >= 50) score += 8;
    if (decliningRate > 30) score -= 15;
    else if (decliningRate > 0) score -= 5;

    // Average progress
    if (avgProgress >= 1.5) score += 10;
    else if (avgProgress >= 0.5) score += 5;
    else if (avgProgress < 0) score -= 10;

    // Achievement
    if (achievedTargets.length > 0) score += achievedTargets.length * 3;

    // YP voice
    if (progress_summary.yp_voice_rate === 100 && targets.length >= 2) score += 5;
    else if (progress_summary.yp_voice_rate < 50) score -= 5;

    // Review compliance — YP participation
    if (review_compliance.yp_participation_rate === 100 && reviews.length >= 2) score += 5;
    else if (review_compliance.yp_participation_rate < 50 && reviews.length >= 2) score -= 5;

    // Overdue reviews
    if (overdueTargets.length > 0) score -= overdueTargets.length * 3;

    // Domain coverage — having targets across multiple domains
    if (domain_profiles.length >= 5) score += 5;
    else if (domain_profiles.length >= 3) score += 2;

    // Declining in any domain is a concern
    const decliningDomains = domain_profiles.filter((d) => d.has_declining);
    if (decliningDomains.length > 0) score -= decliningDomains.length * 3;
  }

  score = clamp(score, 0, 100);

  const progress_rating: OutcomeProgressRating =
    targets.length === 0 ? "no_targets" :
    score >= 80 ? "outstanding" :
    score >= 65 ? "good" :
    score >= 45 ? "adequate" :
    "inadequate";

  // ── Headline ──────────────────────────────────────────────────────────
  const parts: string[] = [];
  parts.push(`Outcome progress: ${progress_rating}`);
  if (targets.length > 0) {
    parts.push(`${targets.length} target${targets.length !== 1 ? "s" : ""} across ${domain_profiles.length} domain${domain_profiles.length !== 1 ? "s" : ""}`);
  }
  if (improvingActive.length > 0) parts.push(`${improvingActive.length} improving`);
  if (decliningActive.length > 0) parts.push(`${decliningActive.length} declining`);
  if (achievedTargets.length > 0) parts.push(`${achievedTargets.length} achieved`);
  if (overdueTargets.length > 0) parts.push(`${overdueTargets.length} review${overdueTargets.length !== 1 ? "s" : ""} overdue`);
  const headline = parts.join(". ") + ".";

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];

  if (progress_rating === "outstanding" || progress_rating === "good") {
    strengths.push(`Outcome tracking rated ${progress_rating} (${score}%). ${child_name}'s targets show clear progress with evidence of real change in the child's life.`);
  }

  if (improvingActive.length > 0 && pct(improvingActive.length, activeTargets.length) >= 60) {
    strengths.push(`${pct(improvingActive.length, activeTargets.length)}% of active targets are improving. This demonstrates that interventions and care planning are translating into measurable progress for ${child_name}.`);
  }

  if (achievedTargets.length > 0) {
    strengths.push(`${achievedTargets.length} outcome target${achievedTargets.length !== 1 ? "s" : ""} achieved. Achieving targets is the clearest evidence that the placement is making a positive difference — exactly what Ofsted wants to see.`);
  }

  if (progress_summary.yp_voice_rate >= 80 && targets.length >= 3) {
    strengths.push(`${child_name}'s voice is captured in ${progress_summary.yp_voice_rate}% of outcome targets. The child's perspective is central to outcome planning — this evidences genuine participation, not tokenism.`);
  }

  if (review_compliance.yp_participation_rate === 100 && reviews.length >= 2) {
    strengths.push(`${child_name} has participated in 100% of outcome reviews. Direct engagement ensures the child understands their targets and feels ownership of their progress.`);
  }

  if (domain_profiles.length >= 5) {
    strengths.push(`Targets span ${domain_profiles.length} outcome domains — a holistic approach to the child's development across all key areas of wellbeing and progress.`);
  }

  const domainsProgressing = domain_profiles.filter((d) => d.progress_gap > 0);
  if (domainsProgressing.length >= 3) {
    const names = domainsProgressing.map((d) => d.domain_label).join(", ");
    strengths.push(`Progress evidenced across ${domainsProgressing.length} domains (${names}). Multi-domain improvement demonstrates that care is having a broad, positive impact.`);
  }

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];

  if (targets.length === 0) {
    concerns.push(`No outcome targets set for ${child_name}. Every looked-after child should have clear, measurable targets linked to their care plan. This is a significant gap in outcomes-focused care planning.`);
  }

  if (decliningActive.length > 0) {
    const decliningDescs = decliningActive.slice(0, 3).map((t) => DOMAIN_LABELS[t.domain]).join(", ");
    concerns.push(`${decliningActive.length} active target${decliningActive.length !== 1 ? "s" : ""} declining (${decliningDescs}). A declining outcome means the child is going backwards — urgent review is needed to understand why and what additional support is required.`);
  }

  if (overdueTargets.length > 0) {
    concerns.push(`${overdueTargets.length} outcome review${overdueTargets.length !== 1 ? "s" : ""} overdue. Regular reviews are essential to track progress, identify barriers, and adjust targets. Overdue reviews mean the child's progress is not being monitored.`);
  }

  if (progress_summary.yp_voice_rate < 50 && targets.length >= 2) {
    concerns.push(`${child_name}'s voice captured in only ${progress_summary.yp_voice_rate}% of targets. The child should be central to their own outcome planning — their views help ensure targets are meaningful and motivating.`);
  }

  if (review_compliance.yp_participation_rate < 50 && reviews.length >= 2) {
    concerns.push(`${child_name} participated in only ${review_compliance.yp_participation_rate}% of reviews. Low participation may indicate disengagement or that reviews are not being conducted in a child-friendly way.`);
  }

  if (activeTargets.length > 0 && avgProgress < 0) {
    concerns.push(`Average progress is negative (${avgProgress}). On aggregate, ${child_name}'s outcomes are moving backwards. This requires immediate attention from the key worker and social worker.`);
  }

  const stagnantTargets = activeTargets.filter((t) => t.direction === "stable" && t.current_rating === t.baseline_rating);
  if (stagnantTargets.length > 0 && stagnantTargets.length >= activeTargets.length / 2) {
    concerns.push(`${stagnantTargets.length} target${stagnantTargets.length !== 1 ? "s" : ""} showing no progress from baseline. Targets that remain static for extended periods suggest the current approach may not be working — consider revising the intervention strategy.`);
  }

  // ── Recommendations ───────────────────────────────────────────────────
  const recommendations: OutcomeRecommendation[] = [];
  let rank = 0;

  if (decliningActive.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Urgently review the ${decliningActive.length} declining target${decliningActive.length !== 1 ? "s" : ""}. Convene a meeting with ${child_name}, key worker, and social worker to identify barriers and agree revised actions or additional support.`,
      urgency: "immediate",
      domain: "progress",
      regulatory_ref: "Reg 6",
    });
  }

  if (overdueTargets.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Complete the ${overdueTargets.length} overdue outcome review${overdueTargets.length !== 1 ? "s" : ""}. Reviews must happen within agreed timescales to ensure continuous monitoring and adjustment of care.`,
      urgency: "immediate",
      domain: "compliance",
      regulatory_ref: "Reg 5",
    });
  }

  if (targets.length === 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Set outcome targets for ${child_name} across at least 4 key domains (health, education, wellbeing, independence). Involve ${child_name} in the target-setting process and capture their voice.`,
      urgency: "immediate",
      domain: "planning",
      regulatory_ref: "Reg 5",
    });
  }

  if (progress_summary.yp_voice_rate < 80 && targets.length >= 2) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Capture ${child_name}'s views for all outcome targets. Use keywork sessions, direct conversations, or creative methods (art, journals) to ensure the child's perspective is recorded.`,
      urgency: "soon",
      domain: "participation",
      regulatory_ref: "Reg 7",
    });
  }

  if (stagnantTargets.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Review the ${stagnantTargets.length} stagnant target${stagnantTargets.length !== 1 ? "s" : ""} where no progress has been made from baseline. Consider whether targets are realistic, whether the right support is in place, or whether a different approach is needed.`,
      urgency: "soon",
      domain: "progress",
      regulatory_ref: "Reg 6",
    });
  }

  const missingDomains = domains.filter((d) => !domain_profiles.some((p) => p.domain === d));
  if (missingDomains.length > 3 && targets.length >= 1) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Consider adding targets in ${missingDomains.slice(0, 3).map((d) => DOMAIN_LABELS[d]).join(", ")}. Holistic outcome tracking across all domains ensures comprehensive care planning.`,
      urgency: "planned",
      domain: "coverage",
      regulatory_ref: "Reg 5",
    });
  }

  // ── ARIA Insights ─────────────────────────────────────────────────────
  const insights: OutcomeInsight[] = [];

  if (progress_rating === "inadequate") {
    insights.push({
      severity: "critical",
      text: `Outcome progress is inadequate (${score}%). Ofsted will scrutinise whether the placement is making a positive difference. ${decliningActive.length > 0 ? `${decliningActive.length} declining targets and ` : ""}${overdueTargets.length > 0 ? `${overdueTargets.length} overdue reviews ` : "limited progress "}signal that current care planning is not achieving the intended outcomes for ${child_name}.`,
    });
  }

  if (decliningActive.length > 0) {
    const worst = decliningActive[0];
    insights.push({
      severity: "critical",
      text: `"${DOMAIN_LABELS[worst.domain]}" is declining (rating ${worst.current_rating}→ from baseline ${worst.baseline_rating}). A declining outcome requires an urgent professional response — the child's trajectory is going in the wrong direction and the current plan is not working.`,
    });
  }

  if (progress_rating === "outstanding") {
    insights.push({
      severity: "positive",
      text: `Outcome progress is outstanding (${score}%). ${child_name}'s targets show sustained, multi-domain improvement with strong child participation. This level of outcomes-focused practice evidences that the placement is genuinely transforming this child's life.`,
    });
  }

  if (improvingActive.length >= 3 && progress_summary.yp_voice_rate >= 80) {
    insights.push({
      severity: "positive",
      text: `${improvingActive.length} targets improving with the child's voice captured throughout. This is the gold standard of outcomes-focused care — measurable progress, child-centred planning, and the young person's perspective driving their own journey.`,
    });
  }

  if (achievedTargets.length >= 2) {
    insights.push({
      severity: "positive",
      text: `${achievedTargets.length} outcome targets achieved — tangible evidence that planned interventions have worked. Each achieved target represents a real improvement in ${child_name}'s wellbeing, skills, or circumstances.`,
    });
  }

  if (targets.length === 0) {
    insights.push({
      severity: "critical",
      text: `No outcome targets set. Without defined targets, there is no framework to measure whether care is making a difference. This will be a significant concern at inspection — Ofsted expect to see clear outcome tracking for every child.`,
    });
  }

  return {
    generated_at: today,
    child_id,
    child_name,
    progress_rating,
    progress_score: score,
    headline,
    progress_summary,
    domain_profiles,
    review_compliance,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
