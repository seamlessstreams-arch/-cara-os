// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME PEER DYNAMICS INTELLIGENCE ENGINE
// Pure deterministic engine: peer relationships, group atmosphere, risk levels.
// CHR 2015 Reg 19: "Behaviour management — relationships between children."
// SCCIF: "Children feel safe with each other and with staff."
// ══════════════════════════════════════════════════════════════════════════════

import { rate, meets, below } from "@/lib/metrics/rate";

// ── Input Types ─────────────────────────────────────────────────────────────

export interface PeerEntryInput {
  id: string;
  date: string;                        // YYYY-MM-DD
  type: string;                        // observation | incident | positive_interaction | mediation | review
  description: string;
  staff_witness: string;
  intervention_used: string;
  outcome: string;
}

export interface PeerDynamicInput {
  id: string;
  child_id_1: string;
  child_id_2: string;
  quality: string;                     // positive | developing | strained | conflicted | neutral
  risk_level: string;                  // none | low | medium | high
  strengths: string[];
  concerns: string[];
  strategies: string[];
  entries: PeerEntryInput[];
  last_review_date: string;            // YYYY-MM-DD
  reviewed_by: string;
  next_review_due: string;             // YYYY-MM-DD
}

export interface PeerGroupAssessmentInput {
  id: string;
  assessment_date: string;             // YYYY-MM-DD
  assessed_by: string;
  overall_atmosphere: string;          // calm | mixed | tense | volatile
  group_strengths: string[];
  group_concerns: string[];
  recommendations: string[];
}

export interface HomePeerDynamicsInput {
  today: string;                       // YYYY-MM-DD
  peer_dynamics: PeerDynamicInput[];
  group_assessments: PeerGroupAssessmentInput[];
  total_children: number;
}

// ── Output Types ────────────────────────────────────────────────────────────

export type PeerDynamicsRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface RelationshipProfile {
  total_pairs: number;
  positive_count: number;
  developing_count: number;
  strained_count: number;
  conflicted_count: number;
  neutral_count: number;
}

export interface RiskProfile {
  none_count: number;
  low_count: number;
  medium_count: number;
  high_count: number;
  highest_risk_level: string;
}

export interface EntryProfile {
  total_entries: number;
  positive_interactions: number;
  incidents: number;
  observations: number;
  mediations: number;
  reviews: number;
  entries_last_30_days: number;
  positive_ratio: number;              // % positive out of total
}

export interface ReviewProfile {
  total_reviews_due: number;
  overdue_reviews: number;
  upcoming_reviews: number;
  avg_days_since_review: number;
}

export interface GroupProfile {
  total_assessments: number;
  latest_atmosphere: string;
  calm_count: number;
  mixed_count: number;
  tense_count: number;
  volatile_count: number;
  total_group_strengths: number;
  total_group_concerns: number;
}

export interface StrategyProfile {
  total_strategies: number;
  pairs_with_strategies: number;
  pairs_needing_strategies: number;    // strained or conflicted without strategies
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

export interface HomePeerDynamicsResult {
  peer_rating: PeerDynamicsRating;
  peer_score: number;
  headline: string;
  relationships: RelationshipProfile;
  risks: RiskProfile;
  entry_profile: EntryProfile;
  review_profile: ReviewProfile;
  group_profile: GroupProfile;
  strategy_profile: StrategyProfile;
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

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return Math.round(nums.reduce((s, n) => s + n, 0) / nums.length);
}

function ratingFromScore(score: number): PeerDynamicsRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeHomePeerDynamics(
  input: HomePeerDynamicsInput,
): HomePeerDynamicsResult {
  const { today, peer_dynamics, group_assessments, total_children } = input;

  // ── Insufficient data guard ───────────────────────────────────────────
  if (total_children === 0 || (peer_dynamics.length === 0 && group_assessments.length === 0)) {
    return {
      peer_rating: "insufficient_data",
      peer_score: 0,
      headline: total_children === 0
        ? "No children currently placed."
        : "No peer dynamics or group assessments recorded.",
      relationships: {
        total_pairs: 0, positive_count: 0, developing_count: 0,
        strained_count: 0, conflicted_count: 0, neutral_count: 0,
      },
      risks: {
        none_count: 0, low_count: 0, medium_count: 0, high_count: 0,
        highest_risk_level: "none",
      },
      entry_profile: {
        total_entries: 0, positive_interactions: 0, incidents: 0,
        observations: 0, mediations: 0, reviews: 0,
        entries_last_30_days: 0, positive_ratio: 0,
      },
      review_profile: {
        total_reviews_due: 0, overdue_reviews: 0, upcoming_reviews: 0,
        avg_days_since_review: 0,
      },
      group_profile: {
        total_assessments: 0, latest_atmosphere: "unknown",
        calm_count: 0, mixed_count: 0, tense_count: 0, volatile_count: 0,
        total_group_strengths: 0, total_group_concerns: 0,
      },
      strategy_profile: {
        total_strategies: 0, pairs_with_strategies: 0, pairs_needing_strategies: 0,
      },
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  // ── Relationship Profile ──────────────────────────────────────────────
  const relationships: RelationshipProfile = {
    total_pairs: peer_dynamics.length,
    positive_count: peer_dynamics.filter((p) => p.quality === "positive").length,
    developing_count: peer_dynamics.filter((p) => p.quality === "developing").length,
    strained_count: peer_dynamics.filter((p) => p.quality === "strained").length,
    conflicted_count: peer_dynamics.filter((p) => p.quality === "conflicted").length,
    neutral_count: peer_dynamics.filter((p) => p.quality === "neutral").length,
  };

  // ── Risk Profile ──────────────────────────────────────────────────────
  const riskOrder = ["none", "low", "medium", "high"];
  const highestIdx = peer_dynamics.reduce(
    (max, p) => Math.max(max, riskOrder.indexOf(p.risk_level)),
    0,
  );

  const risks: RiskProfile = {
    none_count: peer_dynamics.filter((p) => p.risk_level === "none").length,
    low_count: peer_dynamics.filter((p) => p.risk_level === "low").length,
    medium_count: peer_dynamics.filter((p) => p.risk_level === "medium").length,
    high_count: peer_dynamics.filter((p) => p.risk_level === "high").length,
    highest_risk_level: peer_dynamics.length > 0 ? riskOrder[highestIdx] : "none",
  };

  // ── Entry Profile ─────────────────────────────────────────────────────
  const allEntries = peer_dynamics.flatMap((p) => p.entries);
  const entriesLast30 = allEntries.filter(
    (e) => daysBetween(e.date, today) >= 0 && daysBetween(e.date, today) <= 30,
  );

  const entry_profile: EntryProfile = {
    total_entries: allEntries.length,
    positive_interactions: allEntries.filter((e) => e.type === "positive_interaction").length,
    incidents: allEntries.filter((e) => e.type === "incident").length,
    observations: allEntries.filter((e) => e.type === "observation").length,
    mediations: allEntries.filter((e) => e.type === "mediation").length,
    reviews: allEntries.filter((e) => e.type === "review").length,
    entries_last_30_days: entriesLast30.length,
    positive_ratio: pct(
      allEntries.filter((e) => e.type === "positive_interaction").length,
      allEntries.length,
    ),
  };

  // ── Review Profile ────────────────────────────────────────────────────
  const overdue = peer_dynamics.filter(
    (p) => daysBetween(p.next_review_due, today) > 0,
  );
  const upcoming = peer_dynamics.filter(
    (p) => daysBetween(p.next_review_due, today) <= 0,
  );
  const daysSinceReview = peer_dynamics.map(
    (p) => daysBetween(p.last_review_date, today),
  );

  const review_profile: ReviewProfile = {
    total_reviews_due: peer_dynamics.length,
    overdue_reviews: overdue.length,
    upcoming_reviews: upcoming.length,
    avg_days_since_review: avg(daysSinceReview),
  };

  // ── Group Profile ─────────────────────────────────────────────────────
  const sortedAssessments = [...group_assessments].sort(
    (a, b) => b.assessment_date.localeCompare(a.assessment_date),
  );

  const group_profile: GroupProfile = {
    total_assessments: group_assessments.length,
    latest_atmosphere: sortedAssessments.length > 0
      ? sortedAssessments[0].overall_atmosphere
      : "unknown",
    calm_count: group_assessments.filter((g) => g.overall_atmosphere === "calm").length,
    mixed_count: group_assessments.filter((g) => g.overall_atmosphere === "mixed").length,
    tense_count: group_assessments.filter((g) => g.overall_atmosphere === "tense").length,
    volatile_count: group_assessments.filter((g) => g.overall_atmosphere === "volatile").length,
    total_group_strengths: group_assessments.reduce((s, g) => s + g.group_strengths.length, 0),
    total_group_concerns: group_assessments.reduce((s, g) => s + g.group_concerns.length, 0),
  };

  // ── Strategy Profile ──────────────────────────────────────────────────
  const highRiskPairs = peer_dynamics.filter(
    (p) => p.quality === "strained" || p.quality === "conflicted",
  );
  const pairsNeedingStrategies = highRiskPairs.filter(
    (p) => p.strategies.length === 0,
  );

  const strategy_profile: StrategyProfile = {
    total_strategies: peer_dynamics.reduce((s, p) => s + p.strategies.length, 0),
    pairs_with_strategies: peer_dynamics.filter((p) => p.strategies.length > 0).length,
    pairs_needing_strategies: pairsNeedingStrategies.length,
  };

  // ── Scoring ───────────────────────────────────────────────────────────
  const BASE_SCORE = 52;
  let score = BASE_SCORE;

  // mod1: Relationship quality balance (±5)
  const positiveRate = pct(
    relationships.positive_count + relationships.developing_count,
    relationships.total_pairs,
  );
  const mod1 =
    relationships.total_pairs === 0 ? 0 :
    positiveRate >= 75 ? 5 :
    positiveRate >= 50 ? 3 :
    positiveRate >= 25 ? 0 : -5;
  score += mod1;

  // mod2: Risk level (±4)
  const mod2 =
    risks.high_count > 0 ? -4 :
    risks.medium_count > 0 && risks.medium_count > risks.none_count ? -2 :
    risks.medium_count > 0 ? 0 :
    risks.low_count > 0 ? 2 : 4;
  score += mod2;

  // mod3: Entry monitoring frequency (±3)
  const mod3 =
    entry_profile.entries_last_30_days >= 5 ? 3 :
    entry_profile.entries_last_30_days >= 3 ? 2 :
    entry_profile.entries_last_30_days >= 1 ? 0 : -3;
  score += mod3;

  // mod4: Positive interaction ratio (±4)
  const mod4 =
    entry_profile.total_entries === 0 ? 0 :
    entry_profile.positive_ratio >= 50 ? 4 :
    entry_profile.positive_ratio >= 30 ? 2 :
    entry_profile.positive_ratio >= 15 ? 0 : -3;
  score += mod4;

  // mod5: Review compliance (±3)
  const mod5 =
    review_profile.total_reviews_due === 0 ? 0 :
    review_profile.overdue_reviews === 0 ? 3 :
    pct(review_profile.overdue_reviews, review_profile.total_reviews_due) <= 25 ? 1 :
    pct(review_profile.overdue_reviews, review_profile.total_reviews_due) <= 50 ? -1 : -3;
  score += mod5;

  // mod6: Group atmosphere (±4)
  const mod6 =
    group_profile.total_assessments === 0 ? 0 :
    group_profile.latest_atmosphere === "calm" ? 4 :
    group_profile.latest_atmosphere === "mixed" ? 1 :
    group_profile.latest_atmosphere === "tense" ? -2 : -4;
  score += mod6;

  // mod7: Strategy coverage (±3)
  const mod7 =
    highRiskPairs.length === 0 ? 3 :
    strategy_profile.pairs_needing_strategies === 0 ? 3 :
    pct(strategy_profile.pairs_needing_strategies, highRiskPairs.length) <= 25 ? 1 : -3;
  score += mod7;

  // mod8: Coverage completeness (±3)
  // Expected pairs = n*(n-1)/2 for n children — null when there are < 2
  // children (no pairs are possible, so coverage is not measurable). Neutral
  // score in that case rather than a fabricated 100%.
  const expectedPairs = (total_children * (total_children - 1)) / 2;
  const coverageRate = rate(peer_dynamics.length, expectedPairs);
  const mod8 =
    coverageRate === null ? 0 :
    coverageRate >= 80 ? 3 :
    coverageRate >= 50 ? 1 :
    coverageRate >= 25 ? 0 : -2;
  score += mod8;

  // Clamp
  score = Math.max(0, Math.min(100, score));

  const peer_rating = ratingFromScore(score);

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (relationships.positive_count > 0) strengths.push(`${relationships.positive_count} peer relationship(s) rated positive — children supporting each other.`);
  if (risks.high_count === 0 && peer_dynamics.length > 0) strengths.push("No high-risk peer relationships identified.");
  if (entry_profile.positive_ratio >= 50 && entry_profile.total_entries > 0) strengths.push(`${entry_profile.positive_ratio}% of recorded peer interactions are positive.`);
  if (review_profile.overdue_reviews === 0 && peer_dynamics.length > 0) strengths.push("All peer relationship reviews are up to date.");
  if (group_profile.latest_atmosphere === "calm") strengths.push("Latest group assessment indicates a calm atmosphere in the home.");
  if (strategy_profile.pairs_needing_strategies === 0 && highRiskPairs.length > 0) strengths.push("All strained/conflicted relationships have documented strategies.");
  if (meets(coverageRate, 80)) strengths.push(`${coverageRate}% of possible peer pairings have been assessed — comprehensive monitoring.`);
  if (entry_profile.mediations > 0) strengths.push(`${entry_profile.mediations} mediation(s) recorded — active conflict resolution practice.`);

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (relationships.conflicted_count > 0) concerns.push(`${relationships.conflicted_count} peer relationship(s) rated conflicted — active hostility between children.`);
  if (risks.high_count > 0) concerns.push(`${risks.high_count} high-risk peer pairing(s) — safeguarding and supervision must be prioritised.`);
  if (review_profile.overdue_reviews > 0) concerns.push(`${review_profile.overdue_reviews} peer relationship review(s) overdue.`);
  if (group_profile.latest_atmosphere === "volatile") concerns.push("Latest group assessment indicates a volatile atmosphere — all children may feel unsafe.");
  if (group_profile.latest_atmosphere === "tense") concerns.push("Latest group assessment indicates tension — risk of escalation.");
  if (strategy_profile.pairs_needing_strategies > 0) concerns.push(`${strategy_profile.pairs_needing_strategies} strained/conflicted relationship(s) have no documented management strategies.`);
  if (entry_profile.incidents > entry_profile.positive_interactions && entry_profile.total_entries > 0) concerns.push("More peer incidents than positive interactions recorded — negative dynamic prevailing.");
  if (below(coverageRate, 50) && expectedPairs > 0) concerns.push(`Only ${coverageRate}% of possible peer pairings assessed — significant monitoring gaps.`);

  // ── Recommendations ───────────────────────────────────────────────────
  const recommendations: Recommendation[] = [];
  let rank = 0;

  if (risks.high_count > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Urgently review ${risks.high_count} high-risk peer pairing(s). Update risk assessments and supervision plans.`,
      urgency: "immediate",
      regulatory_ref: "Reg 19(2)",
    });
  }
  if (relationships.conflicted_count > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Address ${relationships.conflicted_count} conflicted peer relationship(s) with targeted intervention.`,
      urgency: "immediate",
      regulatory_ref: "Reg 19(1)",
    });
  }
  if (review_profile.overdue_reviews > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Complete ${review_profile.overdue_reviews} overdue peer dynamic review(s) within 7 days.`,
      urgency: "soon",
      regulatory_ref: "Reg 19",
    });
  }
  if (strategy_profile.pairs_needing_strategies > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Document management strategies for ${strategy_profile.pairs_needing_strategies} at-risk peer pairing(s).`,
      urgency: "soon",
      regulatory_ref: "Reg 19(2)",
    });
  }
  if (group_profile.total_assessments === 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Conduct an initial group dynamics assessment to establish baseline.",
      urgency: "soon",
      regulatory_ref: null,
    });
  }
  if (below(coverageRate, 80) && expectedPairs > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Assess remaining peer pairings to achieve comprehensive coverage.",
      urgency: "planned",
      regulatory_ref: null,
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────
  const insights: Insight[] = [];

  if (risks.high_count > 0) {
    insights.push({
      text: `${risks.high_count} peer pairing(s) carry high risk — these children require close supervision and may need separation plans.`,
      severity: "critical",
    });
  }
  if (group_profile.latest_atmosphere === "volatile") {
    insights.push({
      text: "The home atmosphere is volatile. All children may feel unsafe. Consider emergency group intervention.",
      severity: "critical",
    });
  }
  if (relationships.positive_count >= relationships.total_pairs / 2 && relationships.total_pairs > 0) {
    insights.push({
      text: `${pct(relationships.positive_count, relationships.total_pairs)}% of peer relationships are positive — the home fosters healthy connections.`,
      severity: "positive",
    });
  }
  if (entry_profile.positive_interactions > entry_profile.incidents && entry_profile.total_entries >= 3) {
    insights.push({
      text: "Positive peer interactions outnumber incidents — evidence of a nurturing environment.",
      severity: "positive",
    });
  }
  if (entry_profile.incidents >= 3 && entry_profile.incidents > entry_profile.positive_interactions) {
    insights.push({
      text: `${entry_profile.incidents} peer incidents recorded with fewer positive interactions — dynamic is deteriorating.`,
      severity: "critical",
    });
  }
  if (strategy_profile.total_strategies > 0 && strategy_profile.pairs_needing_strategies === 0) {
    insights.push({
      text: `${strategy_profile.total_strategies} management strategies documented across all at-risk pairings — proactive risk management.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────
  const headline =
    peer_rating === "outstanding"
      ? "Exceptional peer dynamics — positive relationships, no high risks, and comprehensive monitoring."
      : peer_rating === "good"
      ? "Good peer relationships with active monitoring and appropriate strategies in place."
      : peer_rating === "adequate"
      ? "Peer dynamics are adequate but some relationships need closer management."
      : "Significant peer relationship concerns — children may not feel safe with each other.";

  return {
    peer_rating,
    peer_score: score,
    headline,
    relationships,
    risks,
    entry_profile,
    review_profile,
    group_profile,
    strategy_profile,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
