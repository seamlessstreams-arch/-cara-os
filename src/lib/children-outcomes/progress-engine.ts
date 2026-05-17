// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Children's Outcomes — Progress Tracking Engine
//
// Deterministic engine for tracking children's progress across the 7 outcome
// domains aligned to Every Child Matters, SCCIF, and Ofsted inspection
// expectations for children's homes:
//
//   1. Being safe (safeguarding, risk, stability)
//   2. Being healthy (physical, mental, emotional health)
//   3. Enjoying & achieving (education, aspirations, activities)
//   4. Making a positive contribution (participation, behaviour, voice)
//   5. Economic wellbeing (independence, life skills, financial literacy)
//   6. Identity & belonging (culture, faith, family, relationships)
//   7. Emotional wellbeing (attachment, resilience, self-regulation)
//
// Each child has a profile scoring progress (1-5) with trend tracking
// and evidence-linked assessments. Reviews feed into Ofsted readiness.
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type OutcomeDomain =
  | "safety"
  | "health"
  | "education"
  | "positive_contribution"
  | "economic_wellbeing"
  | "identity"
  | "emotional_wellbeing";

export type ProgressRating = 1 | 2 | 3 | 4 | 5;
// 1 = Significant concern, 2 = Below expectation, 3 = Expected progress,
// 4 = Good progress, 5 = Exceptional progress

export type Trend = "improving" | "stable" | "declining";

export type ReviewFrequency = "weekly" | "monthly" | "termly" | "6_monthly";

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface ChildProfile {
  childId: string;
  childName: string;
  homeId: string;
  dateOfBirth: string;
  placementStartDate: string;
  keyworkerId: string;
  keyworkerName: string;
  currentOutcomes: OutcomeAssessment[];
  goals: ChildGoal[];
  reviews: ProgressReview[];
  riskLevel: "low" | "medium" | "high" | "very_high";
  legalStatus: "section_20" | "section_31" | "section_38" | "remand" | "voluntary";
}

export interface OutcomeAssessment {
  domain: OutcomeDomain;
  rating: ProgressRating;
  trend: Trend;
  lastAssessedAt: string;
  assessedBy: string;
  evidence: string[];
  targets: string[];
  barriers: string[];
}

export interface ChildGoal {
  id: string;
  domain: OutcomeDomain;
  description: string;
  targetDate: string;
  status: "active" | "achieved" | "revised" | "not_achieved";
  milestones: { description: string; achieved: boolean; achievedAt?: string }[];
  createdAt: string;
  achievedAt?: string;
}

export interface ProgressReview {
  id: string;
  date: string;
  type: "keyworker" | "lac_review" | "care_plan" | "pep" | "health" | "monthly";
  overallProgress: ProgressRating;
  domainRatings: { domain: OutcomeDomain; rating: ProgressRating }[];
  childVoice: string;
  strengthsIdentified: string[];
  areasForDevelopment: string[];
  reviewedBy: string;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface ChildProgressResult {
  childId: string;
  childName: string;
  overallRating: number;           // average across domains (1-5)
  overallTrend: Trend;
  domainSummary: DomainSummary[];
  goalsAchieved: number;
  goalsActive: number;
  goalAchievementRate: number;     // %
  reviewsInPeriod: number;
  lastReviewDate: string | null;
  daysSinceLastReview: number | null;
  reviewOverdue: boolean;
  strengthAreas: OutcomeDomain[];
  concernAreas: OutcomeDomain[];
  recommendations: string[];
}

export interface DomainSummary {
  domain: OutcomeDomain;
  label: string;
  rating: ProgressRating;
  trend: Trend;
  targetCount: number;
  barrierCount: number;
}

export interface CohortAnalysis {
  homeId: string;
  childCount: number;
  averageOverallRating: number;
  byDomain: { domain: OutcomeDomain; averageRating: number; trend: Trend }[];
  childrenImproving: number;
  childrenStable: number;
  childrenDeclining: number;
  strengthDomains: OutcomeDomain[];
  concernDomains: OutcomeDomain[];
  goalAchievementRate: number;     // %
  reviewComplianceRate: number;    // %
  ofstedRating: "outstanding" | "good" | "requires_improvement" | "inadequate";
}

// ── Configuration ──────────────────────────────────────────────────────────

const MAX_DAYS_BETWEEN_REVIEWS = 28; // monthly minimum

const DOMAIN_LABELS: Record<OutcomeDomain, string> = {
  safety: "Being Safe",
  health: "Being Healthy",
  education: "Enjoying & Achieving",
  positive_contribution: "Making a Positive Contribution",
  economic_wellbeing: "Economic Wellbeing",
  identity: "Identity & Belonging",
  emotional_wellbeing: "Emotional Wellbeing",
};

// ── Core: Evaluate Child Progress ─────────────────────────────────────────

export function evaluateChildProgress(
  profile: ChildProfile,
  now?: string,
): ChildProgressResult {
  const currentDate = now ? new Date(now) : new Date();

  // Domain summary
  const domainSummary: DomainSummary[] = profile.currentOutcomes.map(outcome => ({
    domain: outcome.domain,
    label: DOMAIN_LABELS[outcome.domain],
    rating: outcome.rating,
    trend: outcome.trend,
    targetCount: outcome.targets.length,
    barrierCount: outcome.barriers.length,
  }));

  // Overall rating
  const ratings = profile.currentOutcomes.map(o => o.rating);
  const overallRating = ratings.length > 0
    ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
    : 3;

  // Overall trend
  const improving = profile.currentOutcomes.filter(o => o.trend === "improving").length;
  const declining = profile.currentOutcomes.filter(o => o.trend === "declining").length;
  const overallTrend: Trend = improving > declining
    ? "improving"
    : declining > improving
      ? "declining"
      : "stable";

  // Goals analysis
  const goalsAchieved = profile.goals.filter(g => g.status === "achieved").length;
  const goalsActive = profile.goals.filter(g => g.status === "active").length;
  const totalGoals = profile.goals.length;
  const goalAchievementRate = totalGoals > 0
    ? Math.round((goalsAchieved / totalGoals) * 100)
    : 0;

  // Review compliance
  const sortedReviews = [...profile.reviews].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  const lastReview = sortedReviews[0] ?? null;
  const lastReviewDate = lastReview?.date ?? null;
  const daysSinceLastReview = lastReviewDate
    ? Math.floor((currentDate.getTime() - new Date(lastReviewDate).getTime()) / (24 * 60 * 60 * 1000))
    : null;
  const reviewOverdue = daysSinceLastReview !== null && daysSinceLastReview > MAX_DAYS_BETWEEN_REVIEWS;

  // Recent reviews (last 3 months)
  const threeMonthsAgo = new Date(currentDate.getTime() - 90 * 24 * 60 * 60 * 1000);
  const reviewsInPeriod = profile.reviews.filter(r => new Date(r.date) >= threeMonthsAgo).length;

  // Strength and concern areas
  const strengthAreas = profile.currentOutcomes
    .filter(o => o.rating >= 4)
    .map(o => o.domain);
  const concernAreas = profile.currentOutcomes
    .filter(o => o.rating <= 2 || o.trend === "declining")
    .map(o => o.domain);

  // Recommendations
  const recommendations = generateRecommendations(profile, overallRating, concernAreas, reviewOverdue);

  return {
    childId: profile.childId,
    childName: profile.childName,
    overallRating,
    overallTrend,
    domainSummary,
    goalsAchieved,
    goalsActive,
    goalAchievementRate,
    reviewsInPeriod,
    lastReviewDate,
    daysSinceLastReview,
    reviewOverdue,
    strengthAreas,
    concernAreas,
    recommendations,
  };
}

// ── Core: Cohort Analysis ─────────────────────────────────────────────────

export function analyzeCohort(
  profiles: ChildProfile[],
  homeId: string,
  now?: string,
): CohortAnalysis {
  const currentDate = now ? new Date(now) : new Date();

  const progressResults = profiles.map(p => evaluateChildProgress(p, now));

  // Average overall rating
  const averageOverallRating = progressResults.length > 0
    ? Math.round((progressResults.reduce((sum, r) => sum + r.overallRating, 0) / progressResults.length) * 10) / 10
    : 3;

  // By domain
  const domains: OutcomeDomain[] = ["safety", "health", "education", "positive_contribution", "economic_wellbeing", "identity", "emotional_wellbeing"];
  const byDomain = domains.map(domain => {
    const domainRatings = profiles
      .map(p => p.currentOutcomes.find(o => o.domain === domain))
      .filter(Boolean)
      .map(o => o!.rating);
    const avg = domainRatings.length > 0
      ? Math.round((domainRatings.reduce((a, b) => a + b, 0) / domainRatings.length) * 10) / 10
      : 3;

    const trends = profiles
      .map(p => p.currentOutcomes.find(o => o.domain === domain)?.trend)
      .filter(Boolean);
    const improvingCount = trends.filter(t => t === "improving").length;
    const decliningCount = trends.filter(t => t === "declining").length;
    const trend: Trend = improvingCount > decliningCount ? "improving" : decliningCount > improvingCount ? "declining" : "stable";

    return { domain, averageRating: avg, trend };
  });

  // Trend counts
  const childrenImproving = progressResults.filter(r => r.overallTrend === "improving").length;
  const childrenStable = progressResults.filter(r => r.overallTrend === "stable").length;
  const childrenDeclining = progressResults.filter(r => r.overallTrend === "declining").length;

  // Strength/concern domains (cohort level)
  const strengthDomains = byDomain.filter(d => d.averageRating >= 4).map(d => d.domain);
  const concernDomains = byDomain.filter(d => d.averageRating < 3 || d.trend === "declining").map(d => d.domain);

  // Goal achievement rate
  const allGoals = profiles.flatMap(p => p.goals);
  const achieved = allGoals.filter(g => g.status === "achieved").length;
  const goalAchievementRate = allGoals.length > 0
    ? Math.round((achieved / allGoals.length) * 100)
    : 0;

  // Review compliance
  const reviewCompliant = progressResults.filter(r => !r.reviewOverdue).length;
  const reviewComplianceRate = progressResults.length > 0
    ? Math.round((reviewCompliant / progressResults.length) * 100)
    : 100;

  // Ofsted rating
  let ofstedRating: CohortAnalysis["ofstedRating"];
  if (averageOverallRating >= 4.2 && childrenDeclining === 0 && reviewComplianceRate >= 95) {
    ofstedRating = "outstanding";
  } else if (averageOverallRating >= 3.5 && childrenDeclining <= 1) {
    ofstedRating = "good";
  } else if (averageOverallRating >= 2.5) {
    ofstedRating = "requires_improvement";
  } else {
    ofstedRating = "inadequate";
  }

  return {
    homeId,
    childCount: profiles.length,
    averageOverallRating,
    byDomain,
    childrenImproving,
    childrenStable,
    childrenDeclining,
    strengthDomains,
    concernDomains,
    goalAchievementRate,
    reviewComplianceRate,
    ofstedRating,
  };
}

// ── Core: Calculate Domain Score Change ───────────────────────────────────

export interface DomainTrendAnalysis {
  domain: OutcomeDomain;
  currentRating: ProgressRating;
  previousRating: ProgressRating | null;
  change: number;                  // positive = improving
  trend: Trend;
  monthsTracked: number;
  consistentDirection: boolean;    // has trend been same direction for 3+ reviews
}

export function analyzeDomainTrends(
  profile: ChildProfile,
): DomainTrendAnalysis[] {
  return profile.currentOutcomes.map(outcome => {
    // Find historical ratings from reviews
    const domainReviews = profile.reviews
      .filter(r => r.domainRatings.some(dr => dr.domain === outcome.domain))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const previousReview = domainReviews[1]; // second most recent
    const previousRating = previousReview
      ? (previousReview.domainRatings.find(dr => dr.domain === outcome.domain)?.rating ?? null)
      : null;

    const change = previousRating ? outcome.rating - previousRating : 0;

    // Check consistency
    const recentRatings = domainReviews.slice(0, 3).map(r =>
      r.domainRatings.find(dr => dr.domain === outcome.domain)?.rating ?? 3,
    );
    const consistentDirection = recentRatings.length >= 3 &&
      (recentRatings.every((r, i) => i === 0 || r >= recentRatings[i - 1]) ||
       recentRatings.every((r, i) => i === 0 || r <= recentRatings[i - 1]));

    // Months tracked
    const firstReview = domainReviews[domainReviews.length - 1];
    const monthsTracked = firstReview
      ? Math.round((new Date().getTime() - new Date(firstReview.date).getTime()) / (30 * 24 * 60 * 60 * 1000))
      : 0;

    return {
      domain: outcome.domain,
      currentRating: outcome.rating,
      previousRating,
      change,
      trend: outcome.trend,
      monthsTracked,
      consistentDirection,
    };
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────

function generateRecommendations(
  profile: ChildProfile,
  overallRating: number,
  concernAreas: OutcomeDomain[],
  reviewOverdue: boolean,
): string[] {
  const recommendations: string[] = [];

  if (reviewOverdue) {
    recommendations.push("Progress review overdue — schedule within this week.");
  }

  for (const domain of concernAreas) {
    const outcome = profile.currentOutcomes.find(o => o.domain === domain);
    if (outcome && outcome.rating <= 2) {
      recommendations.push(`${DOMAIN_LABELS[domain]}: Rating ${outcome.rating}/5 — requires targeted intervention plan.`);
    } else if (outcome && outcome.trend === "declining") {
      recommendations.push(`${DOMAIN_LABELS[domain]}: Declining trend — investigate barriers and adjust support.`);
    }
  }

  const activeGoalsPastDue = profile.goals.filter(g =>
    g.status === "active" && new Date(g.targetDate) < new Date(),
  );
  if (activeGoalsPastDue.length > 0) {
    recommendations.push(`${activeGoalsPastDue.length} goal(s) past target date — review and revise or close.`);
  }

  if (overallRating >= 4 && concernAreas.length === 0) {
    recommendations.push("Strong progress — consider increasing independence targets and transition planning.");
  }

  return recommendations;
}

export function getDomainLabel(domain: OutcomeDomain): string {
  return DOMAIN_LABELS[domain];
}

export function getAllDomains(): OutcomeDomain[] {
  return ["safety", "health", "education", "positive_contribution", "economic_wellbeing", "identity", "emotional_wellbeing"];
}

export function ratingToLabel(rating: ProgressRating): string {
  const labels: Record<ProgressRating, string> = {
    1: "Significant Concern",
    2: "Below Expectation",
    3: "Expected Progress",
    4: "Good Progress",
    5: "Exceptional Progress",
  };
  return labels[rating];
}
