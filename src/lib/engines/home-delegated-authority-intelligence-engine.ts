// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME DELEGATED AUTHORITY INTELLIGENCE ENGINE
// Pure deterministic engine: delegated authority completeness, review
// compliance, category coverage, status distribution for all children.
// CHR 2015 Reg 22: "Arrangements for the delegation of authority."
// SCCIF: "Staff understand what decisions they can make day to day."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface DelegatedAuthorityItemInput {
  category: string; // medical | education | leisure | overnight_stays | travel | haircut_appearance | social_media | religion | pocket_money | contact | photography | emergency
  status: string;   // granted | not_granted | partial | pending
  detail: string;
  conditions: string;
  granted_by: string;
  granted_date: string;
  review_date: string;
}

export interface DelegatedAuthorityInput {
  id: string;
  child_id: string;
  last_reviewed: string; // YYYY-MM-DD
  next_review: string;   // YYYY-MM-DD
  items: DelegatedAuthorityItemInput[];
  notes: string;
}

export interface HomeDelegatedAuthorityInput {
  today: string; // YYYY-MM-DD
  delegated_authorities: DelegatedAuthorityInput[];
  total_children: number;
}

// ── Output Types ────────────────────────────────────────────────────────────

export type DelegatedAuthorityRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface StatusProfile {
  total_items: number;
  granted: number;
  not_granted: number;
  partial: number;
  pending: number;
  granted_rate: number; // % granted of total
}

export interface CategoryCoverageProfile {
  total_possible_categories: number;
  categories_addressed: number; // at least 1 item in that category across all children
  coverage_rate: number;
  category_distribution: Record<string, number>;
  gaps: string[];
}

export interface ChildCoverageProfile {
  children_with_authority: number;
  total_children: number;
  coverage_rate: number;
  items_per_child: Record<string, number>;
  children_without_authority: number;
}

export interface ReviewProfile {
  total_authorities: number;
  reviews_overdue: number; // next_review is past today
  reviews_due_soon: number; // next_review within 30 days
  avg_days_since_review: number;
  last_reviewed_stale: number; // last_reviewed > 90 days ago
}

export interface Insight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface Recommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string | null;
}

export interface HomeDelegatedAuthorityResult {
  authority_rating: DelegatedAuthorityRating;
  authority_score: number;
  headline: string;
  status_profile: StatusProfile;
  category_coverage: CategoryCoverageProfile;
  child_coverage: ChildCoverageProfile;
  review_profile: ReviewProfile;
  strengths: string[];
  concerns: string[];
  recommendations: Recommendation[];
  insights: Insight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000,
  );
}

function ratingFromScore(score: number): DelegatedAuthorityRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

const ALL_CATEGORIES = [
  "medical",
  "education",
  "leisure",
  "overnight_stays",
  "travel",
  "haircut_appearance",
  "social_media",
  "religion",
  "pocket_money",
  "contact",
  "photography",
  "emergency",
];

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeHomeDelegatedAuthority(
  input: HomeDelegatedAuthorityInput,
): HomeDelegatedAuthorityResult {
  const { today, delegated_authorities, total_children } = input;

  // ── Insufficient data guard ───────────────────────────────────────────
  if (total_children === 0 || delegated_authorities.length === 0) {
    return {
      authority_rating: "insufficient_data",
      authority_score: 0,
      headline: total_children === 0
        ? "No children registered in the home."
        : "No delegated authority records found.",
      status_profile: {
        total_items: 0, granted: 0, not_granted: 0, partial: 0, pending: 0,
        granted_rate: 0,
      },
      category_coverage: {
        total_possible_categories: ALL_CATEGORIES.length,
        categories_addressed: 0, coverage_rate: 0,
        category_distribution: {}, gaps: [...ALL_CATEGORIES],
      },
      child_coverage: {
        children_with_authority: 0, total_children: 0,
        coverage_rate: 0, items_per_child: {}, children_without_authority: 0,
      },
      review_profile: {
        total_authorities: 0, reviews_overdue: 0, reviews_due_soon: 0,
        avg_days_since_review: 0, last_reviewed_stale: 0,
      },
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  const todayDate = today.slice(0, 10);

  // ── Status Profile ────────────────────────────────────────────────────
  const allItems = delegated_authorities.flatMap((da) => da.items);
  const statusCounts = { granted: 0, not_granted: 0, partial: 0, pending: 0 };
  for (const item of allItems) {
    const s = item.status as keyof typeof statusCounts;
    if (s in statusCounts) statusCounts[s]++;
  }

  const status_profile: StatusProfile = {
    total_items: allItems.length,
    ...statusCounts,
    granted_rate: pct(statusCounts.granted, allItems.length),
  };

  // ── Category Coverage Profile ─────────────────────────────────────────
  const categoryDistribution: Record<string, number> = {};
  for (const item of allItems) {
    categoryDistribution[item.category] =
      (categoryDistribution[item.category] || 0) + 1;
  }
  const categoriesAddressed = ALL_CATEGORIES.filter(
    (c) => (categoryDistribution[c] || 0) > 0,
  );
  const gaps = ALL_CATEGORIES.filter((c) => !categoryDistribution[c]);

  const category_coverage: CategoryCoverageProfile = {
    total_possible_categories: ALL_CATEGORIES.length,
    categories_addressed: categoriesAddressed.length,
    coverage_rate: pct(categoriesAddressed.length, ALL_CATEGORIES.length),
    category_distribution: categoryDistribution,
    gaps,
  };

  // ── Child Coverage Profile ────────────────────────────────────────────
  const itemsPerChild: Record<string, number> = {};
  for (const da of delegated_authorities) {
    itemsPerChild[da.child_id] = (itemsPerChild[da.child_id] || 0) + da.items.length;
  }
  const childrenWithAuthority = Object.keys(itemsPerChild).length;

  const child_coverage: ChildCoverageProfile = {
    children_with_authority: childrenWithAuthority,
    total_children,
    coverage_rate: pct(childrenWithAuthority, total_children),
    items_per_child: itemsPerChild,
    children_without_authority: Math.max(0, total_children - childrenWithAuthority),
  };

  // ── Review Profile ────────────────────────────────────────────────────
  const reviewsOverdue = delegated_authorities.filter(
    (da) => da.next_review && daysBetween(da.next_review, todayDate) > 0,
  );
  const reviewsDueSoon = delegated_authorities.filter(
    (da) =>
      da.next_review &&
      daysBetween(todayDate, da.next_review) >= 0 &&
      daysBetween(todayDate, da.next_review) <= 30,
  );
  const daysSinceReviews = delegated_authorities
    .filter((da) => da.last_reviewed && da.last_reviewed.length >= 10)
    .map((da) => daysBetween(da.last_reviewed, todayDate));
  const avgDaysSinceReview =
    daysSinceReviews.length > 0
      ? Math.round(daysSinceReviews.reduce((s, n) => s + n, 0) / daysSinceReviews.length)
      : 0;
  const staleReviews = delegated_authorities.filter(
    (da) =>
      da.last_reviewed &&
      da.last_reviewed.length >= 10 &&
      daysBetween(da.last_reviewed, todayDate) > 90,
  );

  const review_profile: ReviewProfile = {
    total_authorities: delegated_authorities.length,
    reviews_overdue: reviewsOverdue.length,
    reviews_due_soon: reviewsDueSoon.length,
    avg_days_since_review: avgDaysSinceReview,
    last_reviewed_stale: staleReviews.length,
  };

  // ── Scoring ───────────────────────────────────────────────────────────
  const BASE_SCORE = 52;
  let score = BASE_SCORE;

  // mod1: Child coverage (±5)
  const mod1 =
    child_coverage.coverage_rate >= 100 ? 5 :
    child_coverage.coverage_rate >= 75 ? 3 :
    child_coverage.coverage_rate >= 50 ? 1 : -5;
  score += mod1;

  // mod2: Category breadth (±4)
  const mod2 =
    category_coverage.categories_addressed >= 10 ? 4 :
    category_coverage.categories_addressed >= 7 ? 2 :
    category_coverage.categories_addressed >= 4 ? 0 : -3;
  score += mod2;

  // mod3: Granted rate (±4)
  const mod3 =
    status_profile.granted_rate >= 70 ? 4 :
    status_profile.granted_rate >= 50 ? 2 :
    status_profile.granted_rate >= 30 ? 0 : -3;
  score += mod3;

  // mod4: Pending items (±3)
  const pendingRate = pct(statusCounts.pending, allItems.length);
  const mod4 =
    pendingRate === 0 ? 3 :
    pendingRate <= 10 ? 1 :
    pendingRate <= 25 ? -1 : -3;
  score += mod4;

  // mod5: Review compliance (±4)
  const overdueRate = pct(reviewsOverdue.length, delegated_authorities.length);
  const mod5 =
    overdueRate === 0 ? 4 :
    overdueRate <= 25 ? 1 :
    overdueRate <= 50 ? -1 : -4;
  score += mod5;

  // mod6: Review freshness (±3)
  const mod6 =
    avgDaysSinceReview <= 30 ? 3 :
    avgDaysSinceReview <= 60 ? 1 :
    avgDaysSinceReview <= 90 ? 0 : -3;
  score += mod6;

  // mod7: Detail quality — items per child (±3)
  const avgItemsPerChild =
    childrenWithAuthority > 0
      ? Math.round(
          Object.values(itemsPerChild).reduce((s, n) => s + n, 0) /
            childrenWithAuthority,
        )
      : 0;
  const mod7 =
    avgItemsPerChild >= 8 ? 3 :
    avgItemsPerChild >= 5 ? 1 :
    avgItemsPerChild >= 3 ? 0 : -2;
  score += mod7;

  // mod8: Conditions documented (±4)
  const withConditions = allItems.filter(
    (item) => item.conditions && item.conditions.trim().length > 0,
  );
  const conditionsRate = pct(withConditions.length, allItems.length);
  const mod8 =
    conditionsRate >= 80 ? 4 :
    conditionsRate >= 60 ? 2 :
    conditionsRate >= 40 ? 0 : -3;
  score += mod8;

  // Clamp
  score = Math.max(0, Math.min(100, score));

  const authority_rating = ratingFromScore(score);

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (child_coverage.coverage_rate >= 100)
    strengths.push("All children have delegated authority records — full Reg 22 compliance.");
  if (category_coverage.categories_addressed >= 10)
    strengths.push(`${category_coverage.categories_addressed} of ${ALL_CATEGORIES.length} authority categories addressed — comprehensive coverage.`);
  if (status_profile.granted_rate >= 70)
    strengths.push(`${status_profile.granted_rate}% of authority items are granted — staff have clear day-to-day decision-making power.`);
  if (conditionsRate >= 80)
    strengths.push(`${conditionsRate}% of authority items have documented conditions — clear boundaries.`);
  if (overdueRate === 0 && delegated_authorities.length > 0)
    strengths.push("All delegated authority reviews are up to date.");
  if (avgItemsPerChild >= 8)
    strengths.push(`Average ${avgItemsPerChild} authority items per child — thorough coverage of daily decisions.`);

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (child_coverage.children_without_authority > 0)
    concerns.push(`${child_coverage.children_without_authority} child(ren) have no delegated authority record — Reg 22 requires clarity for all children.`);
  if (reviewsOverdue.length > 0)
    concerns.push(`${reviewsOverdue.length} delegated authority review(s) overdue — must be updated.`);
  if (statusCounts.pending > 0)
    concerns.push(`${statusCounts.pending} authority item(s) still pending — staff may not know what decisions they can make.`);
  if (staleReviews.length > 0)
    concerns.push(`${staleReviews.length} authority record(s) last reviewed over 90 days ago.`);
  if (gaps.length >= 5)
    concerns.push(`${gaps.length} authority categories have no entries — significant gaps in delegated decision-making.`);

  // ── Recommendations ───────────────────────────────────────────────────
  const recommendations: Recommendation[] = [];
  let rank = 1;

  if (child_coverage.children_without_authority > 0)
    recommendations.push({
      rank: rank++,
      recommendation: `Create delegated authority records for ${child_coverage.children_without_authority} child(ren) currently without any.`,
      urgency: "immediate",
      regulatory_ref: "Reg 22",
    });

  if (reviewsOverdue.length > 0)
    recommendations.push({
      rank: rank++,
      recommendation: `Complete ${reviewsOverdue.length} overdue delegated authority review(s).`,
      urgency: "immediate",
      regulatory_ref: "Reg 22",
    });

  if (statusCounts.pending > 0)
    recommendations.push({
      rank: rank++,
      recommendation: `Resolve ${statusCounts.pending} pending authority item(s) with the relevant social workers.`,
      urgency: "soon",
      regulatory_ref: "Reg 22",
    });

  if (gaps.length > 0)
    recommendations.push({
      rank: rank++,
      recommendation: `Address gaps in: ${gaps.join(", ").replace(/_/g, " ")}.`,
      urgency: gaps.length >= 5 ? "soon" : "planned",
      regulatory_ref: "SCCIF",
    });

  if (staleReviews.length > 0)
    recommendations.push({
      rank: rank++,
      recommendation: `Review ${staleReviews.length} stale delegated authority record(s) last updated over 90 days ago.`,
      urgency: "soon",
      regulatory_ref: "Reg 22",
    });

  // ── Insights ──────────────────────────────────────────────────────────
  const insights: Insight[] = [];

  if (child_coverage.children_without_authority > 0)
    insights.push({
      text: `${child_coverage.children_without_authority} child(ren) have no delegated authority record. Without this, staff lack clarity on what everyday decisions they can make — this creates delay and frustration for children.`,
      severity: "critical",
    });

  if (statusCounts.pending > 0)
    insights.push({
      text: `${statusCounts.pending} pending authority item(s) mean staff may hesitate on day-to-day decisions. Ofsted expect clear, up-to-date delegated authority for every child.`,
      severity: "warning",
    });

  if (child_coverage.coverage_rate >= 100 && category_coverage.categories_addressed >= 8)
    insights.push({
      text: `All children have delegated authority across ${category_coverage.categories_addressed} categories — staff can make confident, timely decisions that promote children's welfare and enjoyment.`,
      severity: "positive",
    });

  if (reviewsOverdue.length > 0)
    insights.push({
      text: `${reviewsOverdue.length} review(s) are overdue. Delegated authority must reflect current circumstances — out-of-date records risk inappropriate decisions being made.`,
      severity: "warning",
    });

  if (avgItemsPerChild >= 8 && conditionsRate >= 80)
    insights.push({
      text: `Comprehensive delegated authority with clear conditions demonstrates that the home understands and applies Reg 22 effectively — a strong indicator for Ofsted.`,
      severity: "positive",
    });

  // ── Headline ──────────────────────────────────────────────────────────
  const headline =
    authority_rating === "outstanding"
      ? `Excellent delegated authority: ${category_coverage.categories_addressed} categories covered, all reviews current.`
      : authority_rating === "good"
        ? `Good delegated authority framework with ${status_profile.granted_rate}% items granted.`
        : authority_rating === "adequate"
          ? `Delegated authority in place but ${concerns.length > 0 ? concerns.length + " concern(s) need attention" : "requires strengthening"}.`
          : `Delegated authority requires urgent attention — ${reviewsOverdue.length} overdue, ${child_coverage.children_without_authority} child(ren) without records.`;

  return {
    authority_rating,
    authority_score: score,
    headline,
    status_profile,
    category_coverage,
    child_coverage,
    review_profile,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
