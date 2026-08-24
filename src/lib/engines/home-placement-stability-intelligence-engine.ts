// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME PLACEMENT STABILITY INTELLIGENCE ENGINE
// Home-level: analyses placement tenure, incident patterns, missing episode
// trends, return interview compliance, and overall stability across children.
// CHR 2015 Reg 36 (Record Keeping), Reg 44. SCCIF: "Impact on children's
// lives" / "How well children are helped and protected."
// ══════════════════════════════════════════════════════════════════════════════

import { below, formatRate, meets, rate } from "@/lib/metrics/rate";

// ── Input Types ─────────────────────────────────────────────────────────────

export interface PlacementChildInput {
  child_id: string;
  placement_start: string;
  risk_flag_count: number;
}

export interface PlacementIncidentInput {
  child_id: string;
  date: string;
  severity: string;           // low | medium | high | critical
}

export interface PlacementMissingInput {
  child_id: string;
  date: string;
  risk_level: string;         // low | medium | high | critical
  duration_hours: number;
  return_interview_completed: boolean;
  contextual_safeguarding_risk: boolean;
}

export interface HomePlacementStabilityInput {
  today: string;
  children: PlacementChildInput[];
  incidents: PlacementIncidentInput[];
  missing_episodes: PlacementMissingInput[];
  lookback_days?: number;     // default 180
}

// ── Output Types ────────────────────────────────────────────────────────────

export type PlacementStabilityRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface TenureProfile {
  avg_tenure_days: number;
  longest_tenure_days: number;
  shortest_tenure_days: number;
  children_over_6_months: number;
  children_under_3_months: number;
}

export interface IncidentProfile {
  total_incidents: number;
  incident_rate: number | null;              // per child
  high_severity_count: number;
  children_with_incidents: number;
}

export interface MissingProfile {
  total_episodes: number;
  episodes_per_child: number | null;
  avg_duration_hours: number | null;
  high_risk_count: number;
  return_interview_rate: number | null;
  cs_risk_count: number;
}

export interface StabilityProfile {
  children_with_no_events: number;    // no incidents AND no missing
  stability_rate: number | null;
  avg_risk_flags: number;
}

export interface StabilityInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface StabilityRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface HomePlacementStabilityResult {
  stability_rating: PlacementStabilityRating;
  stability_score: number | null;
  headline: string;
  tenure_profile: TenureProfile;
  incident_profile: IncidentProfile;
  missing_profile: MissingProfile;
  stability_profile: StabilityProfile;
  strengths: string[];
  concerns: string[];
  recommendations: StabilityRecommendation[];
  insights: StabilityInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): PlacementStabilityRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000,
  );
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeHomePlacementStability(
  input: HomePlacementStabilityInput,
): HomePlacementStabilityResult {
  const { today, children, lookback_days = 180 } = input;

  if (children.length === 0) {
    return {
      stability_rating: "insufficient_data",
      stability_score: 0,
      headline: "No current placements — stability cannot be assessed.",
      tenure_profile: emptyTenure(),
      incident_profile: emptyIncident(),
      missing_profile: emptyMissing(),
      stability_profile: emptyStability(),
      strengths: [],
      concerns: ["No current placements recorded."],
      recommendations: [{ rank: 1, recommendation: "Ensure all current placements are recorded with accurate start dates.", urgency: "immediate", regulatory_ref: "Reg 36" }],
      insights: [{ text: "No current placement data found. Ofsted requires clear evidence that children's placement records are maintained and that the home can demonstrate stability and progress for each child.", severity: "critical" }],
    };
  }

  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() - lookback_days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const incidents = input.incidents.filter(i => i.date >= cutoffStr && i.date <= today);
  const episodes = input.missing_episodes.filter(m => m.date >= cutoffStr && m.date <= today);

  // ── Tenure Profile ─────────────────────────────────────────────
  const tenureDays = children.map(c => Math.max(0, daysBetween(c.placement_start, today)));
  const avgTenure = Math.round(tenureDays.reduce((s, d) => s + d, 0) / tenureDays.length);
  const longestTenure = Math.max(...tenureDays);
  const shortestTenure = Math.min(...tenureDays);
  const over6Months = tenureDays.filter(d => d >= 180).length;
  const under3Months = tenureDays.filter(d => d < 90).length;

  const tenureProfile: TenureProfile = {
    avg_tenure_days: avgTenure,
    longest_tenure_days: longestTenure,
    shortest_tenure_days: shortestTenure,
    children_over_6_months: over6Months,
    children_under_3_months: under3Months,
  };

  // ── Incident Profile ───────────────────────────────────────────
  const totalIncidents = incidents.length;
  const incidentRate = Math.round((totalIncidents / children.length) * 10) / 10;
  const highSeverity = incidents.filter(
    i => i.severity === "high" || i.severity === "critical",
  ).length;
  const childrenWithIncidents = new Set(incidents.map(i => i.child_id)).size;

  const incidentProfile: IncidentProfile = {
    total_incidents: totalIncidents,
    incident_rate: incidentRate,
    high_severity_count: highSeverity,
    children_with_incidents: childrenWithIncidents,
  };

  // ── Missing Profile ────────────────────────────────────────────
  const totalEpisodes = episodes.length;
  const episodesPerChild = children.length > 0
    ? Math.round((totalEpisodes / children.length) * 10) / 10
    : null;
  const avgDuration = totalEpisodes > 0
    ? Math.round((episodes.reduce((s, e) => s + e.duration_hours, 0) / totalEpisodes) * 10) / 10
    : null;
  const highRiskEpisodes = episodes.filter(
    e => e.risk_level === "high" || e.risk_level === "critical",
  ).length;
  const withReturnInterview = episodes.filter(e => e.return_interview_completed).length;
  const returnInterviewRate = rate(withReturnInterview, totalEpisodes);
  const csRiskCount = episodes.filter(e => e.contextual_safeguarding_risk).length;

  const missingProfile: MissingProfile = {
    total_episodes: totalEpisodes,
    episodes_per_child: episodesPerChild,
    avg_duration_hours: avgDuration,
    high_risk_count: highRiskEpisodes,
    return_interview_rate: returnInterviewRate,
    cs_risk_count: csRiskCount,
  };

  // ── Stability Profile ──────────────────────────────────────────
  const childrenWithIncidentsSet = new Set(incidents.map(i => i.child_id));
  const childrenWithMissingSet = new Set(episodes.map(e => e.child_id));
  const childrenWithEvents = new Set([...childrenWithIncidentsSet, ...childrenWithMissingSet]);
  const childrenNoEvents = children.filter(c => !childrenWithEvents.has(c.child_id)).length;
  const stabilityRate = rate(childrenNoEvents, children.length);
  const avgRiskFlags = Math.round(
    (children.reduce((s, c) => s + c.risk_flag_count, 0) / children.length) * 10,
  ) / 10;

  const stabilityProfile: StabilityProfile = {
    children_with_no_events: childrenNoEvents,
    stability_rate: stabilityRate,
    avg_risk_flags: avgRiskFlags,
  };

  // ── Scoring ───────────────────────────────────────────────────
  // Base 52, max bonuses = 28, 52+28 = 80
  let score = 52;

  // 1. Placement tenure (±5)
  if (avgTenure >= 180) score += 5;
  else if (avgTenure >= 90) score += 3;
  else if (avgTenure >= 30) score += 1;
  else score -= 4;

  // 2. Incident rate per child (±4)
  if (totalIncidents === 0) score += 4;
  else if (incidentRate <= 1.0) score += 2;
  else if (incidentRate <= 2.0) score += 0;
  else score -= 3;

  // 3. High severity incidents (±3)
  if (highSeverity === 0) score += 3;
  else if (highSeverity <= 1) score += 1;
  else score -= 2;

  // 4. Missing episode total (±4)
  if (totalEpisodes === 0) score += 4;
  else if (totalEpisodes <= 1) score += 2;
  else if (totalEpisodes <= 3) score += 0;
  else score -= 3;

  // 5. High-risk missing episodes (±3)
  if (highRiskEpisodes === 0) score += 3;
  else if (highRiskEpisodes <= 1) score += 1;
  else score -= 2;

  // 6. Return interview completion (±3)
  if (totalEpisodes > 0) {
    if (meets(returnInterviewRate, 90)) score += 3;
    else if (meets(returnInterviewRate, 70)) score += 1;
    else score -= 2;
  } else {
    score += 3; // No episodes — best possible state
  }

  // 7. Stability rate (±3)
  if (meets(stabilityRate, 80)) score += 3;
  else if (meets(stabilityRate, 50)) score += 1;
  else score -= 2;

  // 8. Risk flags (±3)
  if (avgRiskFlags <= 1) score += 3;
  else if (avgRiskFlags <= 2) score += 1;
  else score -= 2;

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────
  const strengths: string[] = [];
  if (avgTenure >= 180) strengths.push(`Average placement tenure is ${avgTenure} days — children are settled and stable.`);
  if (totalIncidents === 0) strengths.push("No incidents recorded in the review period — a calm and stable home environment.");
  if (totalEpisodes === 0) strengths.push("No missing from care episodes — children feel safe and want to be here.");
  if (meets(stabilityRate, 80)) strengths.push(`${formatRate(stabilityRate)} of children have had no incidents or missing episodes — strong placement stability.`);
  if (meets(returnInterviewRate, 90) && totalEpisodes > 0) strengths.push(`${formatRate(returnInterviewRate)} return interview completion — proper safeguarding response.`);
  if (avgRiskFlags <= 1) strengths.push("Low average risk flags — manageable risk profile across placements.");

  // ── Concerns ──────────────────────────────────────────────────
  const concerns: string[] = [];
  if (avgTenure < 30) concerns.push(`Average placement tenure is only ${avgTenure} days — placements may not have had time to stabilise.`);
  if (highSeverity > 1) concerns.push(`${highSeverity} high/critical severity incidents recorded — escalation patterns need investigation.`);
  if (totalEpisodes > 3) concerns.push(`${totalEpisodes} missing from care episodes — frequency indicates significant placement instability.`);
  if (highRiskEpisodes > 1) concerns.push(`${highRiskEpisodes} high-risk missing episodes — safeguarding risks require urgent review.`);
  if (totalEpisodes > 0 && below(returnInterviewRate, 70)) concerns.push(`Only ${formatRate(returnInterviewRate)} of return interviews completed — safeguarding response is inadequate.`);
  if (below(stabilityRate, 50)) concerns.push(`Only ${formatRate(stabilityRate)} of children have had no incidents or missing episodes — placement stability is fragile.`);

  // ── Recommendations ───────────────────────────────────────────
  const recs: StabilityRecommendation[] = [];
  let rank = 1;

  if (highSeverity > 1) {
    recs.push({ rank: rank++, recommendation: `${highSeverity} high-severity incidents recorded — convene a multi-agency review to identify patterns and de-escalation strategies.`, urgency: "immediate", regulatory_ref: "Reg 36" });
  }
  if (totalEpisodes > 0 && below(returnInterviewRate, 70)) {
    recs.push({ rank: rank++, recommendation: `Return interview completion is only ${formatRate(returnInterviewRate)} — every missing episode must have a return interview within 72 hours.`, urgency: "immediate", regulatory_ref: "Reg 44" });
  }
  if (totalEpisodes > 3) {
    recs.push({ rank: rank++, recommendation: "Review missing from care patterns — look for common triggers, times, and locations across episodes.", urgency: "soon", regulatory_ref: "Reg 44" });
  }
  if (below(stabilityRate, 50)) {
    recs.push({ rank: rank++, recommendation: "Multiple children are experiencing incidents or going missing — review care plans, staffing patterns, and environmental triggers.", urgency: "soon", regulatory_ref: "Reg 36" });
  }

  // ── Insights ──────────────────────────────────────────────────
  const insights: StabilityInsight[] = [];

  if (totalIncidents === 0 && totalEpisodes === 0 && avgTenure >= 180) {
    insights.push({ text: `Placement stability is exemplary — all ${children.length} children have been placed for an average of ${avgTenure} days with no incidents and no missing episodes. Ofsted will recognise a home where children feel safe, settled, and genuinely want to be. This is the foundation of outstanding care.`, severity: "positive" });
  }
  if (highSeverity > 1) {
    insights.push({ text: `${highSeverity} high-severity incidents suggest an escalation pattern that needs immediate attention. Ofsted will scrutinise whether the home has identified triggers, implemented preventive strategies, and involved multi-agency partners. Failure to address high-severity patterns risks regulatory action.`, severity: "critical" });
  }
  if (totalEpisodes > 3) {
    insights.push({ text: `${totalEpisodes} missing from care episodes across ${children.length} children is significantly above expectations. Patterns of going missing are a key Ofsted focus — they indicate potential placement instability, exploitation risk, or unmet needs. A thorough analysis of triggers, timing, and peer influences is essential.`, severity: "critical" });
  }
  if (csRiskCount > 0) {
    insights.push({ text: `${csRiskCount} missing episode${csRiskCount > 1 ? "s" : ""} flagged contextual safeguarding risk — this indicates potential exploitation or harmful external influences. Ofsted will expect to see multi-agency responses, MASH referrals where appropriate, and evidence that risk assessments have been updated.`, severity: "warning" });
  }

  // ── Headline ──────────────────────────────────────────────────
  let headline: string;
  if (rating === "outstanding") {
    headline = `Outstanding placement stability — ${children.length} children, avg ${avgTenure} days tenure, ${totalIncidents} incidents, ${totalEpisodes} missing episodes.`;
  } else if (rating === "good") {
    headline = `Good placement stability — settled children with minor incident or missing patterns.`;
  } else if (rating === "adequate") {
    headline = "Adequate placement stability — incident frequency, missing episodes, or tenure need attention.";
  } else {
    headline = "Placement stability is inadequate — significant concerns about incidents, missing episodes, or placement disruption.";
  }

  return {
    stability_rating: rating,
    stability_score: score,
    headline,
    tenure_profile: tenureProfile,
    incident_profile: incidentProfile,
    missing_profile: missingProfile,
    stability_profile: stabilityProfile,
    strengths,
    concerns,
    recommendations: recs,
    insights,
  };
}

// ── Empty Profiles ──────────────────────────────────────────────────────────

function emptyTenure(): TenureProfile {
  return { avg_tenure_days: 0, longest_tenure_days: 0, shortest_tenure_days: 0, children_over_6_months: 0, children_under_3_months: 0 };
}

function emptyIncident(): IncidentProfile {
  return { total_incidents: 0, incident_rate: 0, high_severity_count: 0, children_with_incidents: 0 };
}

function emptyMissing(): MissingProfile {
  return { total_episodes: 0, episodes_per_child: 0, avg_duration_hours: 0, high_risk_count: 0, return_interview_rate: 0, cs_risk_count: 0 };
}

function emptyStability(): StabilityProfile {
  return { children_with_no_events: 0, stability_rate: 0, avg_risk_flags: 0 };
}
