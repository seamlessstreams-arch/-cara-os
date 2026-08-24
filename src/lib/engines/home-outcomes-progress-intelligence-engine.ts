// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME OUTCOMES PROGRESS INTELLIGENCE ENGINE
// Home-level: analyses therapeutic outcome targets — domain coverage, rating
// progress, direction trends, review timeliness, young person voice, and
// child-level equity across the home.
// CHR 2015 Reg 6 (Quality of Care), Reg 44, Reg 45. SCCIF: "Impact on
// children's lives" — "Progress and outcomes", "Experiences and progress".
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface OutcomeTargetInput {
  id: string;
  child_id: string;
  domain: string;
  baseline_rating: number;       // 1–5
  current_rating: number;        // 1–5
  target_rating: number;         // 1–5
  direction: string;             // improving | stable | declining
  status: string;                // active | achieved | on_hold | revised
  review_date: string;           // YYYY-MM-DD
  set_date: string;              // YYYY-MM-DD
  has_yp_voice: boolean;
  has_evidence: boolean;
}

export interface OutcomeReviewInput {
  id: string;
  target_id: string;
  child_id: string;
  review_date: string;           // YYYY-MM-DD
  previous_rating: number;       // 1–5
  new_rating: number;            // 1–5
  direction: string;             // improving | stable | declining
  yp_participated: boolean;
  has_barriers: boolean;
  has_next_steps: boolean;
}

export interface HomeOutcomesProgressInput {
  today: string;
  targets: OutcomeTargetInput[];
  reviews: OutcomeReviewInput[];
  total_children: number;
  lookback_days?: number;        // default 90
}

// ── Output Types ────────────────────────────────────────────────────────────

export type OutcomesRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface DomainProfile {
  total_domains_covered: number;
  domains_represented: string[];
  domains_missing: string[];
  avg_targets_per_domain: number | null;
}

export interface ProgressProfile {
  improving_count: number;
  stable_count: number;
  declining_count: number;
  improving_rate: number | null;
  declining_rate: number | null;
  avg_current_rating: number;
  avg_baseline_rating: number;
  avg_progress: number;          // avg(current - baseline)
  achieved_count: number;
  on_target_count: number;       // current >= target
}

export interface ReviewProfile {
  total_reviews: number;
  reviews_in_window: number;
  avg_reviews_per_target: number | null;
  overdue_targets: number;       // review_date < today
  overdue_rate: number | null;
  yp_participation_rate: number | null; // % of reviews where YP participated
  reviews_with_barriers: number;
  reviews_with_next_steps: number;
}

export interface EquityProfile {
  children_with_targets: number;
  children_without_targets: number;
  coverage_rate: number | null;         // % of total_children with ≥1 target
  avg_targets_per_child: number | null;
  min_targets: number | null;
  max_targets: number | null;
  yp_voice_rate: number | null;         // % of targets with YP voice recorded
}

export interface OutcomesInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface OutcomesRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface HomeOutcomesProgressResult {
  outcomes_rating: OutcomesRating;
  outcomes_score: number | null;
  headline: string;
  domain_profile: DomainProfile;
  progress_profile: ProgressProfile;
  review_profile: ReviewProfile;
  equity_profile: EquityProfile;
  strengths: string[];
  concerns: string[];
  recommendations: OutcomesRecommendation[];
  insights: OutcomesInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const ALL_DOMAINS = [
  "health", "education", "emotional_wellbeing", "identity",
  "family_social", "self_care", "independence", "behaviour",
];

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 10) / 10;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): OutcomesRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

function emptyDomain(): DomainProfile {
  return { total_domains_covered: 0, domains_represented: [], domains_missing: [...ALL_DOMAINS], avg_targets_per_domain: 0 };
}

function emptyProgress(): ProgressProfile {
  return { improving_count: 0, stable_count: 0, declining_count: 0, improving_rate: null, declining_rate: null, avg_current_rating: 0, avg_baseline_rating: 0, avg_progress: 0, achieved_count: 0, on_target_count: 0 };
}

function emptyReview(): ReviewProfile {
  return { total_reviews: 0, reviews_in_window: 0, avg_reviews_per_target: 0, overdue_targets: 0, overdue_rate: null, yp_participation_rate: null, reviews_with_barriers: 0, reviews_with_next_steps: 0 };
}

function emptyEquity(): EquityProfile {
  return { children_with_targets: 0, children_without_targets: 0, coverage_rate: null, avg_targets_per_child: 0, min_targets: 0, max_targets: 0, yp_voice_rate: null };
}

// ── Main Function ──────────────────────────────────────────────────────────

export function computeHomeOutcomesProgress(
  input: HomeOutcomesProgressInput,
): HomeOutcomesProgressResult {
  const { today, targets, reviews, total_children, lookback_days = 90 } = input;

  // Active targets only for analysis
  const activeTargets = targets.filter(t => t.status === "active" || t.status === "achieved");

  if (activeTargets.length === 0) {
    return {
      outcomes_rating: "insufficient_data",
      outcomes_score: 0,
      headline: "No outcome targets recorded — therapeutic progress cannot be assessed.",
      domain_profile: emptyDomain(),
      progress_profile: emptyProgress(),
      review_profile: emptyReview(),
      equity_profile: emptyEquity(),
      strengths: [],
      concerns: ["No outcome targets are recorded for any child."],
      recommendations: [{ rank: 1, recommendation: "Establish individual outcome targets for each child covering at least 4 domains, with clear success criteria and young person voice.", urgency: "immediate", regulatory_ref: "Reg 6" }],
      insights: [{ text: "No outcome targets exist. Ofsted inspectors under SCCIF specifically seek evidence that 'children make progress against their individual care plans and targets' — this gap represents a significant regulatory risk.", severity: "critical" }],
    };
  }

  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() - lookback_days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  // Filter reviews within lookback window
  const recentReviews = reviews.filter(r => r.review_date >= cutoffStr && r.review_date <= today);

  // ── Domain Profile ────────────────────────────────────────────
  const domainSet = new Set(activeTargets.map(t => t.domain));
  const domainsRepresented = ALL_DOMAINS.filter(d => domainSet.has(d));
  const domainsMissing = ALL_DOMAINS.filter(d => !domainSet.has(d));
  const avgTargetsPerDomain = domainsRepresented.length > 0
    ? Math.round((activeTargets.length / domainsRepresented.length) * 10) / 10
    : null;

  const domainProfile: DomainProfile = {
    total_domains_covered: domainsRepresented.length,
    domains_represented: domainsRepresented,
    domains_missing: domainsMissing,
    avg_targets_per_domain: avgTargetsPerDomain,
  };

  // ── Progress Profile ──────────────────────────────────────────
  const improvingCount = activeTargets.filter(t => t.direction === "improving").length;
  const stableCount = activeTargets.filter(t => t.direction === "stable").length;
  const decliningCount = activeTargets.filter(t => t.direction === "declining").length;
  const achievedCount = activeTargets.filter(t => t.status === "achieved").length;
  const onTargetCount = activeTargets.filter(t => t.current_rating >= t.target_rating).length;

  const progressProfile: ProgressProfile = {
    improving_count: improvingCount,
    stable_count: stableCount,
    declining_count: decliningCount,
    improving_rate: pct(improvingCount, activeTargets.length),
    declining_rate: pct(decliningCount, activeTargets.length),
    avg_current_rating: avg(activeTargets.map(t => t.current_rating)),
    avg_baseline_rating: avg(activeTargets.map(t => t.baseline_rating)),
    avg_progress: avg(activeTargets.map(t => t.current_rating - t.baseline_rating)),
    achieved_count: achievedCount,
    on_target_count: onTargetCount,
  };

  // ── Review Profile ────────────────────────────────────────────
  const overdueTargets = activeTargets.filter(t => t.status === "active" && t.review_date < today).length;
  const activeForOverdue = activeTargets.filter(t => t.status === "active").length;
  const overdueRate = pct(overdueTargets, activeForOverdue);

  const ypParticipated = recentReviews.filter(r => r.yp_participated).length;
  const reviewsWithBarriers = recentReviews.filter(r => r.has_barriers).length;
  const reviewsWithNextSteps = recentReviews.filter(r => r.has_next_steps).length;

  const avgReviewsPerTarget = activeTargets.length > 0
    ? Math.round((recentReviews.length / activeTargets.length) * 10) / 10
    : null;

  const reviewProfile: ReviewProfile = {
    total_reviews: reviews.length,
    reviews_in_window: recentReviews.length,
    avg_reviews_per_target: avgReviewsPerTarget,
    overdue_targets: overdueTargets,
    overdue_rate: overdueRate,
    yp_participation_rate: pct(ypParticipated, recentReviews.length),
    reviews_with_barriers: reviewsWithBarriers,
    reviews_with_next_steps: reviewsWithNextSteps,
  };

  // ── Equity Profile ────────────────────────────────────────────
  const childMap: Record<string, number> = {};
  for (const t of activeTargets) {
    childMap[t.child_id] = (childMap[t.child_id] ?? 0) + 1;
  }
  const childrenWithTargets = Object.keys(childMap).length;
  const childrenWithout = Math.max(0, total_children - childrenWithTargets);
  const coverageRate = total_children > 0
    ? pct(childrenWithTargets, total_children)
    : (childrenWithTargets > 0 ? 100  : null);
  const perChildCounts = Object.values(childMap);
  const minTargets = perChildCounts.length > 0 ? Math.min(...perChildCounts) : null;
  const maxTargets = perChildCounts.length > 0 ? Math.max(...perChildCounts) : null;
  const avgPerChild = perChildCounts.length > 0
    ? Math.round((perChildCounts.reduce((s, c) => s + c, 0) / perChildCounts.length) * 10) / 10
    : null;

  const targetsWithVoice = activeTargets.filter(t => t.has_yp_voice).length;
  const ypVoiceRate = pct(targetsWithVoice, activeTargets.length);

  const equityProfile: EquityProfile = {
    children_with_targets: childrenWithTargets,
    children_without_targets: childrenWithout,
    coverage_rate: coverageRate,
    avg_targets_per_child: avgPerChild,
    min_targets: minTargets,
    max_targets: maxTargets,
    yp_voice_rate: ypVoiceRate,
  };

  // ── Scoring ──────────────────────────────────────────────────
  // Base 52, max bonuses = 28, 52 + 28 = 80
  let score = 52;

  // 1. Domain coverage (±4)
  if (domainsRepresented.length >= 6) score += 4;
  else if (domainsRepresented.length >= 4) score += 2;
  else if (domainsRepresented.length >= 2) score += 0;
  else score -= 3;

  // 2. Improving direction rate (±4)
  const improvingRate = pct(improvingCount, activeTargets.length);
  if (improvingRate >= 60) score += 4;
  else if (improvingRate >= 40) score += 2;
  else if (improvingRate >= 20) score += 0;
  else score -= 3;

  // 3. Declining rate (±3)
  const decliningRate = pct(decliningCount, activeTargets.length);
  if (decliningCount === 0) score += 3;
  else if (decliningRate <= 10) score += 1;
  else if (decliningRate <= 25) score += 0;
  else score -= 2;

  // 4. Average progress (±4)
  const avgProg = progressProfile.avg_progress;
  if (avgProg >= 1.5) score += 4;
  else if (avgProg >= 1.0) score += 2;
  else if (avgProg >= 0.5) score += 1;
  else if (avgProg >= 0) score += 0;
  else score -= 3;

  // 5. Review timeliness (±3)
  if (overdueRate === 0) score += 3;
  else if (overdueRate <= 20) score += 1;
  else if (overdueRate <= 50) score += 0;
  else score -= 2;

  // 6. YP voice in targets (±4)
  if (ypVoiceRate >= 80) score += 4;
  else if (ypVoiceRate >= 60) score += 2;
  else if (ypVoiceRate >= 40) score += 0;
  else score -= 3;

  // 7. Child coverage (±3)
  if ((coverageRate ?? 0) >= 100) score += 3;
  else if ((coverageRate ?? 0) >= 75) score += 1;
  else if ((coverageRate ?? 0) >= 50) score += 0;
  else score -= 2;

  // 8. Review activity (±3)
  if ((avgReviewsPerTarget ?? 0) >= 0.5) score += 3;
  else if ((avgReviewsPerTarget ?? 0) >= 0.3) score += 1;
  else if ((avgReviewsPerTarget ?? 0) >= 0.1) score += 0;
  else score -= 2;

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────
  const strengths: string[] = [];
  if (domainsRepresented.length >= 6) strengths.push(`${domainsRepresented.length} out of 8 outcome domains covered — comprehensive therapeutic breadth.`);
  if (improvingRate >= 60) strengths.push(`${improvingRate}% of targets are improving — children are making meaningful progress.`);
  if (decliningCount === 0) strengths.push("No targets are declining — all children are maintaining or building on progress.");
  if (ypVoiceRate >= 80) strengths.push(`${ypVoiceRate}% of targets include young person voice — excellent child participation.`);
  if ((coverageRate ?? 0) >= 100) strengths.push("All children have individual outcome targets — equitable focus on every child's progress.");
  if (overdueRate === 0 && activeForOverdue > 0) strengths.push("All target reviews are up to date — strong review discipline.");
  if (avgProg >= 1.5) strengths.push(`Average rating improvement of ${avgProg} points — strong upward trajectory across all children.`);

  // ── Concerns ──────────────────────────────────────────────────
  const concerns: string[] = [];
  if (domainsRepresented.length < 4) concerns.push(`Only ${domainsRepresented.length} out of 8 domains covered — key areas of children's lives are not being targeted.`);
  if (decliningRate > 25) concerns.push(`${decliningRate}% of targets are declining — children are losing ground on their outcomes.`);
  if (childrenWithout > 0 && total_children > 0) concerns.push(`${childrenWithout} child${childrenWithout > 1 ? "ren" : ""} ha${childrenWithout > 1 ? "ve" : "s"} no outcome targets — their progress is not being tracked.`);
  if (overdueRate > 50) concerns.push(`${overdueRate}% of target reviews are overdue — review discipline has lapsed.`);
  if (ypVoiceRate < 40) concerns.push(`Only ${ypVoiceRate}% of targets include young person voice — children's wishes and feelings are underrepresented.`);
  if (avgProg < 0) concerns.push(`Average rating has declined by ${Math.abs(avgProg)} points — outcomes are worsening across the home.`);

  // ── Recommendations ───────────────────────────────────────────
  const recs: OutcomesRecommendation[] = [];
  let rank = 1;

  if (childrenWithout > 0 && total_children > 0) {
    recs.push({ rank: rank++, recommendation: `${childrenWithout} child${childrenWithout > 1 ? "ren" : ""} ha${childrenWithout > 1 ? "ve" : "s"} no outcome targets — set individual targets covering at least 4 domains per child.`, urgency: "immediate", regulatory_ref: "Reg 6" });
  }
  if (decliningCount > 0) {
    recs.push({ rank: rank++, recommendation: `${decliningCount} target${decliningCount > 1 ? "s are" : " is"} declining — conduct urgent reviews to identify barriers and adjust support plans.`, urgency: decliningRate > 25 ? "immediate" : "soon", regulatory_ref: "Reg 6" });
  }
  if (overdueRate > 20) {
    recs.push({ rank: rank++, recommendation: `${overdueTargets} target review${overdueTargets > 1 ? "s are" : " is"} overdue — schedule reviews within the next 7 days.`, urgency: overdueRate > 50 ? "immediate" : "soon", regulatory_ref: "Reg 45" });
  }
  if (ypVoiceRate < 60) {
    recs.push({ rank: rank++, recommendation: `Young person voice is recorded in only ${ypVoiceRate}% of targets — ensure children's wishes and feelings are captured at every review.`, urgency: "soon", regulatory_ref: "Reg 7" });
  }
  if (domainsMissing.length > 4) {
    recs.push({ rank: rank++, recommendation: `${domainsMissing.length} outcome domains are missing targets — broaden therapeutic focus to cover health, education, emotional wellbeing, identity, family, self-care, independence, and behaviour.`, urgency: "planned", regulatory_ref: "Reg 6" });
  }

  // ── Insights ──────────────────────────────────────────────────
  const insights: OutcomesInsight[] = [];

  if (rating === "outstanding") {
    insights.push({ text: `Exemplary outcomes practice — ${activeTargets.length} targets across ${domainsRepresented.length} domains with ${improvingRate}% improving. Children's progress is well-evidenced, regularly reviewed, and informed by their own voice. Ofsted inspectors will find strong evidence that the home is making a measurable difference to children's lives.`, severity: "positive" });
  }
  if (decliningCount > 0) {
    const decliningChildren = [...new Set(activeTargets.filter(t => t.direction === "declining").map(t => t.child_id))].length;
    insights.push({ text: `${decliningCount} target${decliningCount > 1 ? "s" : ""} across ${decliningChildren} child${decliningChildren > 1 ? "ren" : ""} ${decliningCount > 1 ? "are" : "is"} declining. Under SCCIF, inspectors specifically look for evidence that 'children make progress' — any regression requires investigation and management response.`, severity: decliningRate > 25 ? "critical" : "warning" });
  }
  if (overdueRate > 50) {
    insights.push({ text: `${overdueRate}% of target reviews are overdue. Review timeliness directly evidences the home's commitment to monitoring children's progress. Ofsted inspectors will expect to see that care plans are 'regularly reviewed and updated'.`, severity: "critical" });
  }
  if (childrenWithout > 0 && total_children > 0) {
    insights.push({ text: `${childrenWithout} of ${total_children} children have no outcome targets. Regulation 6 requires the home to provide care designed to meet each child's needs and promote their welfare. An absence of measurable targets for any child represents a significant gap.`, severity: "critical" });
  }
  if (ypVoiceRate >= 80 && recentReviews.length > 0) {
    const reviewParticipation = pct(ypParticipated, recentReviews.length);
    if (reviewParticipation >= 80) {
      insights.push({ text: `Young people's voices are strongly present — ${ypVoiceRate}% of targets and ${reviewParticipation}% of reviews include their wishes and feelings. This demonstrates genuine child-centred practice aligned with Regulation 7 (children's wishes and feelings).`, severity: "positive" });
    }
  }

  // ── Headline ──────────────────────────────────────────────────
  let headline: string;
  if (rating === "outstanding") {
    headline = `Outstanding outcomes practice — ${activeTargets.length} targets across ${domainsRepresented.length} domains, ${improvingRate}% improving, with strong YP voice.`;
  } else if (rating === "good") {
    headline = `Good outcomes progress — ${improvingRate}% of targets improving across ${domainsRepresented.length} domains.`;
  } else if (rating === "adequate") {
    headline = `Adequate outcomes tracking — progress is mixed with ${decliningCount > 0 ? `${decliningCount} declining target${decliningCount > 1 ? "s" : ""}` : "limited improvement"}.`;
  } else {
    headline = `Inadequate outcomes framework — ${decliningRate > 25 ? "significant decline in ratings" : "coverage gaps and limited progress evidence"} need urgent attention.`;
  }

  return {
    outcomes_rating: rating,
    outcomes_score: score,
    headline,
    domain_profile: domainProfile,
    progress_profile: progressProfile,
    review_profile: reviewProfile,
    equity_profile: equityProfile,
    strengths,
    concerns,
    recommendations: recs,
    insights,
  };
}
