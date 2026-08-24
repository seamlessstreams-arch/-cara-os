// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME DIVERSITY, INCLUSION & EQUALITY INTELLIGENCE ENGINE
// Home-level: aggregates LGBTQ+ support records, diversity events,
// hate incidents, and cultural plans to assess inclusion practice.
// CHR 2015 Reg 5: Quality of care — promoting equality and diversity.
// Equality Act 2010: Protected characteristics and duty to eliminate
// discrimination.
// ══════════════════════════════════════════════════════════════════════════════

import { below, formatRate, meets, rate } from "@/lib/metrics/rate";

// ── Input types ─────────────────────────────────────────────────────────────

export interface LgbtqSupportInput {
  id: string;
  child_id: string;
  pronouns_used_consistently: boolean;
  preferred_name_used_consistently: boolean;
  identity_affirming_actions_count: number;
  external_support_count: number;
  staff_actions_count: number;
  has_challenges: boolean;
}

export interface DiversityEventInput {
  id: string;
  category: string; // "religious"|"cultural"|"national"|"awareness"|"heritage"|"lgbtq"|"disability"
  status: string; // "planned"|"completed"|"in_progress"|"cancelled"
  relevant_to_children: boolean;
}

export interface HateIncidentInput {
  id: string;
  date: string;
  status: string; // "reported"|"investigating"|"resolved"|"closed"|"nfa"
  reported_to_police: boolean;
  reported_to_ofsted: boolean;
  restorative_approach_used: boolean;
  prevention_measures_count: number;
  learnings_documented: boolean;
}

export interface CulturalPlanInput {
  id: string;
  child_id: string;
  has_heritage_activities: boolean;
  has_identity_work: boolean;
  has_faith_support: boolean;
  child_led: boolean;
}

export interface DiversityInclusionInput {
  today: string;
  total_children: number;
  lgbtq_records: LgbtqSupportInput[];
  diversity_events: DiversityEventInput[];
  hate_incidents: HateIncidentInput[];
  cultural_plans: CulturalPlanInput[];
}

// ── Output types ────────────────────────────────────────────────────────────

export type DiversityInclusionRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface DiversityInclusionResult {
  diversity_rating: DiversityInclusionRating;
  diversity_score: number;
  headline: string;
  children_with_cultural_plans: number;
  /** null when the population is empty — nothing measured, not 0%. */
  identity_affirmation_rate: number | null;
  diversity_events_completed: number;
  hate_incidents_total: number;
  /** null when the population is empty — nothing measured, not 0%. */
  hate_resolution_rate: number | null;
  strengths: string[];
  concerns: string[];
  recommendations: {
    rank: number;
    recommendation: string;
    urgency: "immediate" | "soon" | "planned";
    regulatory_ref: string;
  }[];
  insights: { text: string; severity: "critical" | "warning" | "positive" }[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeDiversityInclusionEquality(
  input: DiversityInclusionInput,
): DiversityInclusionResult {
  const {
    total_children,
    lgbtq_records,
    diversity_events,
    hate_incidents,
    cultural_plans,
  } = input;

  // ── Insufficient data guard ──────────────────────────────────────────
  if (total_children === 0) {
    return {
      diversity_rating: "insufficient_data",
      diversity_score: 0,
      headline: "No children in placement — diversity and inclusion analysis unavailable.",
      children_with_cultural_plans: 0,
      identity_affirmation_rate: null,
      diversity_events_completed: 0,
      hate_incidents_total: 0,
      hate_resolution_rate: null,
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  // ── Metrics ──────────────────────────────────────────────────────────
  const uniquePlanChildIds = new Set(cultural_plans.map((p) => p.child_id));
  const children_with_cultural_plans = uniquePlanChildIds.size;
  const culturalPlanCoverage = rate(children_with_cultural_plans, total_children);

  const lgbtqAffirmed = lgbtq_records.filter(
    (r) => r.pronouns_used_consistently && r.preferred_name_used_consistently,
  ).length;
  const identity_affirmation_rate = rate(lgbtqAffirmed, lgbtq_records.length);

  const diversity_events_completed = diversity_events.filter(
    (e) => e.status === "completed",
  ).length;
  const eventCompletionRate = rate(
    diversity_events_completed,
    diversity_events.length,
  );

  const hate_incidents_total = hate_incidents.length;
  const hateResolved = hate_incidents.filter(
    (h) => h.status === "resolved" || h.status === "closed",
  ).length;
  const hate_resolution_rate = rate(hateResolved, hate_incidents_total);

  const childLedPlans = cultural_plans.filter((p) => p.child_led).length;
  const childLedRate = rate(childLedPlans, cultural_plans.length);

  const hateWithLearningsAndPrevention = hate_incidents.filter(
    (h) => h.learnings_documented && h.prevention_measures_count > 0,
  ).length;
  const preventionLearningRate = rate(
    hateWithLearningsAndPrevention,
    hate_incidents_total,
  );

  // ══════════════════════════════════════════════════════════════════════
  // SCORING — base 55 + 6 modifiers (max +27 w/o hate, +30 w/ hate) → outstanding reachable at 82
  // ══════════════════════════════════════════════════════════════════════

  let score = 55;

  // ── Mod 1: Cultural plan coverage (±5) ──────────────────────────────
  if (meets(culturalPlanCoverage, 80)) score += 5;
  else if (meets(culturalPlanCoverage, 50)) score += 2;
  else if (meets(culturalPlanCoverage, 20)) score += 0;
  else score -= 5;

  // ── Mod 2: Identity affirmation (±6/+3 neutral) ────────────────────
  if (lgbtq_records.length === 0) {
    score += 3;
  } else {
    if (meets(identity_affirmation_rate, 90)) score += 6;
    else if (meets(identity_affirmation_rate, 70)) score += 3;
    else if (meets(identity_affirmation_rate, 40)) score += 0;
    else score -= 5;
  }

  // ── Mod 3: Diversity event engagement (±5/-1) ──────────────────────
  if (diversity_events.length === 0) {
    score -= 1;
  } else {
    if (meets(eventCompletionRate, 80)) score += 5;
    else if (meets(eventCompletionRate, 60)) score += 2;
    else if (meets(eventCompletionRate, 30)) score += 0;
    else score -= 4;
  }

  // ── Mod 4: Hate incident management (±5) ───────────────────────────
  if (hate_incidents_total === 0) {
    score += 5;
  } else {
    if (meets(hate_resolution_rate, 90)) score += 3;
    else if (meets(hate_resolution_rate, 60)) score += 0;
    else score -= 5;
  }

  // ── Mod 5: Cultural plan quality — child-led (±4/-1) ───────────────
  if (cultural_plans.length === 0) {
    score -= 1;
  } else {
    if (meets(childLedRate, 80)) score += 4;
    else if (meets(childLedRate, 50)) score += 1;
    else if (meets(childLedRate, 20)) score += 0;
    else score -= 4;
  }

  // ── Mod 6: Prevention & learning (±5/+2 neutral) ──────────────────
  if (hate_incidents_total === 0) {
    score += 2;
  } else {
    if (meets(preventionLearningRate, 90)) score += 5;
    else if (meets(preventionLearningRate, 70)) score += 2;
    else if (meets(preventionLearningRate, 40)) score += 0;
    else score -= 5;
  }

  // ── Clamp ────────────────────────────────────────────────────────────
  score = Math.max(0, Math.min(100, score));

  // ── Rating ───────────────────────────────────────────────────────────
  let diversity_rating: DiversityInclusionRating;
  if (score >= 80) diversity_rating = "outstanding";
  else if (score >= 65) diversity_rating = "good";
  else if (score >= 45) diversity_rating = "adequate";
  else diversity_rating = "inadequate";

  // ══════════════════════════════════════════════════════════════════════
  // NARRATIVE
  // ══════════════════════════════════════════════════════════════════════

  const strengths: string[] = [];
  const concerns: string[] = [];
  const recommendations: DiversityInclusionResult["recommendations"] = [];
  const insights: DiversityInclusionResult["insights"] = [];
  let rank = 0;

  // ── Strengths ────────────────────────────────────────────────────────
  if (meets(culturalPlanCoverage, 80)) {
    strengths.push(
      `Excellent cultural plan coverage — ${formatRate(culturalPlanCoverage)} of children have cultural plans in place.`,
    );
  }
  if (meets(identity_affirmation_rate, 90) && lgbtq_records.length > 0) {
    strengths.push(
      `Outstanding identity affirmation — ${formatRate(identity_affirmation_rate)} of LGBTQ+ young people have consistent pronoun and name use.`,
    );
  }
  if (hate_incidents_total === 0) {
    strengths.push(
      "Zero hate incidents recorded — the home maintains a safe, inclusive environment.",
    );
  }
  if (
    diversity_events.length > 0 &&
    diversity_events_completed === diversity_events.length
  ) {
    strengths.push(
      `All ${diversity_events_completed} diversity events completed — strong engagement with equality and diversity programming.`,
    );
  }
  if (cultural_plans.length > 0 && childLedRate === 100) {
    strengths.push(
      "All cultural plans are child-led — children are actively shaping their own cultural identity support.",
    );
  }
  if (
    hate_incidents_total > 0 &&
    hateResolved === hate_incidents_total &&
    hateWithLearningsAndPrevention === hate_incidents_total
  ) {
    strengths.push(
      "All hate incidents resolved with documented learnings and prevention measures in place.",
    );
  }

  // ── Concerns ─────────────────────────────────────────────────────────
  const unresolvedHate = hate_incidents.filter(
    (h) => h.status !== "resolved" && h.status !== "closed",
  );
  if (unresolvedHate.length > 0) {
    concerns.push(
      `${unresolvedHate.length} hate incident(s) remain unresolved — immediate action required to safeguard children.`,
    );
  }
  if (below(culturalPlanCoverage, 30)) {
    concerns.push(
      `Low cultural plan coverage — only ${formatRate(culturalPlanCoverage)} of children have cultural plans.`,
    );
  }
  const lgbtqInconsistent = lgbtq_records.filter(
    (r) =>
      !r.pronouns_used_consistently || !r.preferred_name_used_consistently,
  );
  if (lgbtqInconsistent.length > 0) {
    concerns.push(
      `${lgbtqInconsistent.length} LGBTQ+ record(s) show inconsistent use of preferred names or pronouns.`,
    );
  }
  if (diversity_events.length === 0) {
    concerns.push(
      "No diversity events planned — the home is not actively promoting equality and diversity awareness.",
    );
  }
  const hateWithoutPrevention = hate_incidents.filter(
    (h) => h.prevention_measures_count === 0,
  );
  if (hateWithoutPrevention.length > 0) {
    concerns.push(
      `${hateWithoutPrevention.length} hate incident(s) have no prevention measures recorded.`,
    );
  }

  // ── Recommendations ──────────────────────────────────────────────────
  if (unresolvedHate.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Resolve all outstanding hate incidents urgently — ensure restorative approaches and prevention measures are in place.",
      urgency: "immediate",
      regulatory_ref: "Equality Act 2010",
    });
  }
  if (below(culturalPlanCoverage, 30)) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop cultural plans for all children, ensuring each plan is co-produced with the child.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5",
    });
  }
  if (lgbtqInconsistent.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Provide staff training on consistent use of preferred names and pronouns for all LGBTQ+ young people.",
      urgency: "soon",
      regulatory_ref: "Equality Act 2010",
    });
  }
  if (diversity_events.length === 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish a diversity events calendar covering cultural, religious, and awareness events throughout the year.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5",
    });
  }
  if (hateWithoutPrevention.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Document prevention measures for all hate incidents and review effectiveness at team meetings.",
      urgency: "soon",
      regulatory_ref: "Equality Act 2010",
    });
  }

  // Cap at 5 recommendations
  recommendations.splice(5);

  // ── Insights ─────────────────────────────────────────────────────────
  if (
    hate_incidents_total === 0 &&
    diversity_events.length > 0 &&
    meets(eventCompletionRate, 80)
  ) {
    insights.push({
      text: "Zero hate incidents combined with strong diversity event engagement indicates an inclusive, culturally aware home environment.",
      severity: "positive",
    });
  }

  if (hate_incidents_total >= 3) {
    insights.push({
      text: `${hate_incidents_total} hate incidents recorded — this pattern suggests systemic issues requiring whole-home intervention.`,
      severity: "critical",
    });
  }

  if (
    diversity_events.length > 0 &&
    below(eventCompletionRate, 30)
  ) {
    insights.push({
      text: `Only ${formatRate(eventCompletionRate)} of diversity events completed — low participation may indicate disengagement or planning issues.`,
      severity: "warning",
    });
  }

  // Cap at 3 insights
  insights.splice(3);

  // ── Headline ─────────────────────────────────────────────────────────
  let headline: string;
  if (diversity_rating === "outstanding") {
    headline =
      "Diversity, inclusion, and equality practice is exemplary — children's identities are celebrated and protected.";
  } else if (diversity_rating === "good") {
    headline =
      "Good diversity and inclusion practice with opportunities to strengthen cultural engagement.";
  } else if (diversity_rating === "adequate") {
    headline =
      "Diversity and inclusion practice is developing but gaps in coverage and consistency need addressing.";
  } else {
    headline =
      "Significant shortfalls in diversity, inclusion, and equality — children may be at risk of discrimination or identity harm.";
  }

  return {
    diversity_rating,
    diversity_score: score,
    headline,
    children_with_cultural_plans,
    identity_affirmation_rate,
    diversity_events_completed,
    hate_incidents_total,
    hate_resolution_rate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
