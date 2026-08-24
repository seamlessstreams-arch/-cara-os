// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME MANAGEMENT WALKROUND & OVERSIGHT INTELLIGENCE ENGINE
// Pure deterministic engine: walkround frequency, observations, child/staff
// interactions, environmental checks, follow-up actions, and emerging themes.
// CHR 2015 Reg 13: "The leadership and management standard."
// SCCIF: "Well-led and managed."
// ══════════════════════════════════════════════════════════════════════════════

import { below, meets, rate } from "@/lib/metrics/rate";

// ── Input Types ─────────────────────────────────────────────────────────────

export interface WalkroundInput {
  id: string;
  walkround_type: string; // "daily"|"weekly_themed"|"unannounced"|"pre_inspection_rehearsal"|"post_incident_review"
  positive_observations_count: number;
  improvements_count: number;
  child_interactions_count: number;
  staff_interactions_count: number;
  environmental_checks_good: number;
  environmental_checks_total: number;
  immediate_actions_count: number;
  follow_up_actions_count: number;
  follow_up_actions_completed: number;
  themes_count: number;
  positive_practice_noted_count: number;
}

export interface ManagementWalkroundInput {
  today: string;
  total_staff: number;
  walkrounds: WalkroundInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type WalkroundRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface ManagementWalkroundResult {
  walkround_rating: WalkroundRating;
  walkround_score: number;
  headline: string;
  total_walkrounds: number;
  /** null when the population is empty — nothing measured, not 0%. */
  positive_observation_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  environmental_pass_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  child_interaction_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  follow_up_completion_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  unannounced_rate: number | null;
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

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): WalkroundRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeManagementWalkroundOversight(
  input: ManagementWalkroundInput,
): ManagementWalkroundResult {
  const { walkrounds, total_staff } = input;

  // Insufficient data guard
  if (total_staff === 0) {
    return {
      walkround_rating: "insufficient_data",
      walkround_score: 0,
      headline: "No data available for management walkround analysis",
      total_walkrounds: 0,
      positive_observation_rate: 0,
      environmental_pass_rate: 0,
      child_interaction_rate: 0,
      follow_up_completion_rate: 0,
      unannounced_rate: 0,
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  // ── Metrics ────────────────────────────────────────────────────────────
  const total = walkrounds.length;

  const totalPositive = walkrounds.reduce((s, w) => s + w.positive_observations_count, 0);
  const totalObs = totalPositive + walkrounds.reduce((s, w) => s + w.improvements_count, 0);
  const positiveObsRate = rate(totalPositive, totalObs);

  const envGood = walkrounds.reduce((s, w) => s + w.environmental_checks_good, 0);
  const envTotal = walkrounds.reduce((s, w) => s + w.environmental_checks_total, 0);
  const envPassRate = rate(envGood, envTotal);

  const withChildInteraction = walkrounds.filter(w => w.child_interactions_count > 0).length;
  const childInteractionRate = rate(withChildInteraction, total);

  const totalFollowUp = walkrounds.reduce((s, w) => s + w.follow_up_actions_count, 0);
  const completedFollowUp = walkrounds.reduce((s, w) => s + w.follow_up_actions_completed, 0);
  const followUpRate = rate(completedFollowUp, totalFollowUp);

  const unannounced = walkrounds.filter(w => w.walkround_type === "unannounced").length;
  const unannouncedRate = rate(unannounced, total);

  // ── Scoring ────────────────────────────────────────────────────────────
  let score = 52;

  // Modifier 1: Walkround frequency
  if (total >= 8) score += 5;
  else if (total >= 4) score += 2;
  else if (total === 0) score -= 5;

  // Modifier 2: Positive observation balance
  if (totalObs === 0 && total > 0) {
    score -= 1;
  } else if (totalObs === 0) {
    // no walkrounds, no adjustment
  } else {
    if (meets(positiveObsRate, 70)) score += 6;
    else if (meets(positiveObsRate, 50)) score += 2;
    else if (below(positiveObsRate, 30)) score -= 5;
  }

  // Modifier 3: Environmental pass rate
  if (envTotal === 0 && total > 0) {
    score -= 1;
  } else if (envTotal === 0) {
    // no data
  } else {
    if (meets(envPassRate, 90)) score += 5;
    else if (meets(envPassRate, 70)) score += 2;
    else if (below(envPassRate, 50)) score -= 4;
  }

  // Modifier 4: Child interaction during walkrounds
  if (total === 0) {
    // no adjustment
  } else {
    if (meets(childInteractionRate, 80)) score += 5;
    else if (meets(childInteractionRate, 50)) score += 2;
    else if (below(childInteractionRate, 30)) score -= 5;
  }

  // Modifier 5: Follow-up action completion
  if (totalFollowUp === 0 && total > 0) {
    score += 2;
  } else if (totalFollowUp === 0) {
    score -= 1;
  } else {
    if (meets(followUpRate, 90)) score += 4;
    else if (meets(followUpRate, 70)) score += 1;
    else if (below(followUpRate, 50)) score -= 4;
  }

  // Modifier 6: Unannounced walkrounds (demonstrates proactive oversight)
  if (total === 0) {
    score -= 2;
  } else {
    if (meets(unannouncedRate, 30)) score += 5;
    else if (meets(unannouncedRate, 15)) score += 2;
    else if (unannouncedRate === 0) score -= 3;
  }

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Headline ───────────────────────────────────────────────────────────
  let headline: string;
  switch (rating) {
    case "outstanding":
      headline = "Management walkrounds are frequent, thorough and drive continuous improvement";
      break;
    case "good":
      headline = "Good management oversight with regular walkrounds and effective follow-through";
      break;
    case "adequate":
      headline = "Management walkrounds are adequate but need more consistency and depth";
      break;
    case "inadequate":
      headline = "Management walkround practice is inadequate — oversight of the home is insufficient";
      break;
    default:
      headline = "No data available for management walkround analysis";
  }

  // ── Strengths ──────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (total >= 8) strengths.push("High frequency of management walkrounds demonstrates active oversight");
  if (meets(positiveObsRate, 70) && totalObs > 0) strengths.push("Walkrounds consistently identify and celebrate positive practice");
  if (meets(envPassRate, 90) && envTotal > 0) strengths.push("Environmental standards are maintained to a high level across the home");
  if (meets(childInteractionRate, 80) && total > 0) strengths.push("Managers routinely engage with children during walkrounds — voice of child is central");
  if (meets(followUpRate, 90) && totalFollowUp > 0) strengths.push("Follow-up actions from walkrounds are completed promptly and effectively");
  if (meets(unannouncedRate, 30) && total > 0) strengths.push("Regular unannounced walkrounds demonstrate proactive, authentic oversight");

  // ── Concerns ───────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (total === 0) concerns.push("No management walkrounds recorded — this is a significant governance gap");
  if (below(positiveObsRate, 30) && totalObs > 0) concerns.push("Walkrounds are overly focused on deficits — positive practice is not being recognised");
  if (below(envPassRate, 50) && envTotal > 0) concerns.push("Environmental checks reveal widespread issues requiring urgent attention");
  if (below(childInteractionRate, 30) && total > 0) concerns.push("Children are rarely engaged during walkrounds — their experience is not being directly observed");
  if (below(followUpRate, 50) && totalFollowUp > 0) concerns.push("Walkround follow-up actions are not being completed — oversight has no teeth");
  if (unannouncedRate === 0 && total > 0) concerns.push("No unannounced walkrounds — Ofsted expects managers to see unscripted, authentic practice");

  // ── Recommendations ────────────────────────────────────────────────────
  const recs: ManagementWalkroundResult["recommendations"] = [];

  if (total === 0) {
    recs.push({ rank: 1, recommendation: "Implement a structured management walkround schedule with at least weekly rounds", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 13" });
  }
  if (total > 0 && total < 4) {
    recs.push({ rank: recs.length + 1, recommendation: "Increase walkround frequency to provide more consistent management visibility", urgency: "soon", regulatory_ref: "CHR 2015 Reg 13" });
  }
  if (below(childInteractionRate, 50) && total > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Ensure walkrounds include meaningful engagement with children about their experience", urgency: "soon", regulatory_ref: "SCCIF Voice of Child" });
  }
  if (below(followUpRate, 70) && totalFollowUp > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Strengthen tracking of walkround follow-up actions to completion", urgency: "soon", regulatory_ref: "CHR 2015 Reg 13" });
  }
  if (unannouncedRate === 0 && total > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Introduce regular unannounced walkrounds to observe authentic everyday practice", urgency: "planned", regulatory_ref: "SCCIF Leadership" });
  }
  if (below(envPassRate, 70) && envTotal > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Address environmental issues identified in walkrounds to maintain safe premises", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 25" });
  }

  const cappedRecs = recs.slice(0, 5).map((r, i) => ({ ...r, rank: i + 1 }));

  // ── Insights ───────────────────────────────────────────────────────────
  const insights: ManagementWalkroundResult["insights"] = [];

  if (total >= 8 && meets(positiveObsRate, 70) && meets(childInteractionRate, 80)) {
    insights.push({ text: "Management oversight is exemplary — walkrounds are frequent, balanced, and child-focused", severity: "positive" });
  }
  if (total === 0) {
    insights.push({ text: "No walkrounds recorded suggests management is disconnected from day-to-day practice — regulators will flag this", severity: "critical" });
  }
  if (below(followUpRate, 50) && totalFollowUp > 0) {
    insights.push({ text: "Walkrounds without follow-through are performative — actions must be tracked to completion", severity: "warning" });
  }
  if (meets(childInteractionRate, 80) && total > 0) {
    insights.push({ text: "High child engagement during walkrounds means managers hear directly how care feels — strong evidence for inspectors", severity: "positive" });
  }
  if (meets(unannouncedRate, 30) && total > 0) {
    insights.push({ text: "Unannounced walkrounds show a culture of transparency — staff expect and welcome oversight", severity: "positive" });
  }

  const cappedInsights = insights.slice(0, 3);

  return {
    walkround_rating: rating,
    walkround_score: score,
    headline,
    total_walkrounds: total,
    positive_observation_rate: positiveObsRate,
    environmental_pass_rate: envPassRate,
    child_interaction_rate: childInteractionRate,
    follow_up_completion_rate: followUpRate,
    unannounced_rate: unannouncedRate,
    strengths,
    concerns,
    recommendations: cappedRecs,
    insights: cappedInsights,
  };
}
