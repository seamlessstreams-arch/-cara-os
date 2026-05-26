// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME MISSING EPISODES INTELLIGENCE ENGINE
// Home-level: synthesises missing from care episodes across all children to
// produce an overall missing episodes and safeguarding response intelligence.
// CHR 2015 Reg 12, 34. SCCIF: "Safe."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface MissingEpisodeInput {
  id: string;
  child_id: string;
  date_missing: string;                  // YYYY-MM-DD
  duration_hours: number;
  risk_level: string;                    // "low" | "medium" | "high"
  reported_to_police: boolean;
  reported_to_la: boolean;
  return_interview_completed: boolean;
  contextual_safeguarding_risk: boolean;
  status: string;                        // "open" | "closed"
}

export interface HomeMissingEpisodesInput {
  today: string;
  total_children: number;
  child_ids: string[];
  missing_episodes: MissingEpisodeInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type MissingEpisodesRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface EpisodeProfile {
  total_90d: number;
  total_180d: number;
  high_risk_count: number;
  avg_duration_hours: number;
  longest_duration_hours: number;
  children_with_episodes: string[];
  repeat_children: string[];             // children with 2+ episodes in 180d
  police_reported_rate: number;          // % reported to police (high risk)
  la_reported_rate: number;              // % reported to LA
  return_interview_rate: number;         // % with return interview completed
  contextual_safeguarding_count: number;
  open_episodes: number;
}

export interface PatternProfile {
  escalating: boolean;                   // duration or frequency increasing
  concentrated_child: string | null;     // child with most episodes
  concentrated_count: number;
  trend: "improving" | "stable" | "worsening" | "insufficient_data";
}

export interface MissingEpisodesInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface MissingEpisodesRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface HomeMissingEpisodesResult {
  missing_episodes_rating: MissingEpisodesRating;
  missing_episodes_score: number;
  headline: string;
  episodes: EpisodeProfile;
  pattern: PatternProfile;
  strengths: string[];
  concerns: string[];
  recommendations: MissingEpisodesRecommendation[];
  insights: MissingEpisodesInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): MissingEpisodesRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeHomeMissingEpisodes(
  input: HomeMissingEpisodesInput,
): HomeMissingEpisodesResult {
  const { today, total_children, child_ids, missing_episodes } = input;

  // Safety engines: fewer episodes = better. Start high if no data.
  if (missing_episodes.length === 0) {
    return {
      missing_episodes_rating: "outstanding",
      missing_episodes_score: 90,
      headline: "No missing from care episodes recorded — excellent safeguarding position.",
      episodes: emptyEpisodes(),
      pattern: emptyPattern(),
      strengths: ["No missing from care episodes — children are safe, settled, and accounted for."],
      concerns: [],
      recommendations: [],
      insights: [{ text: "Zero missing episodes is an excellent indicator of placement stability and child safety. Ofsted will view this very positively.", severity: "positive" }],
    };
  }

  // ── Episode Profile ───────────────────────────────────────────────────
  const eps90d = missing_episodes.filter(e => {
    const d = daysBetween(e.date_missing, today);
    return d >= 0 && d <= 90;
  });
  const eps180d = missing_episodes.filter(e => {
    const d = daysBetween(e.date_missing, today);
    return d >= 0 && d <= 180;
  });

  const highRisk = eps180d.filter(e => e.risk_level === "high");
  const durations = eps180d.map(e => e.duration_hours);
  const avgDuration = durations.length > 0
    ? Math.round((durations.reduce((s, v) => s + v, 0) / durations.length) * 10) / 10
    : 0;
  const longestDuration = durations.length > 0 ? Math.max(...durations) : 0;

  const childrenWithEps = [...new Set(eps180d.map(e => e.child_id))];

  // Repeat children (2+ episodes in 180d)
  const childCounts: Record<string, number> = {};
  for (const e of eps180d) {
    childCounts[e.child_id] = (childCounts[e.child_id] || 0) + 1;
  }
  const repeatChildren = Object.entries(childCounts)
    .filter(([, count]) => count >= 2)
    .map(([id]) => id);

  // Reporting compliance
  const highRiskEps = eps180d.filter(e => e.risk_level === "high" || e.risk_level === "medium");
  const policeReported = highRiskEps.filter(e => e.reported_to_police);
  const policeRate = highRiskEps.length > 0
    ? Math.round((policeReported.length / highRiskEps.length) * 100)
    : 100;

  const laReported = eps180d.filter(e => e.reported_to_la);
  const laRate = eps180d.length > 0
    ? Math.round((laReported.length / eps180d.length) * 100)
    : 100;

  const riCompleted = eps180d.filter(e => e.return_interview_completed);
  const riRate = eps180d.length > 0
    ? Math.round((riCompleted.length / eps180d.length) * 100)
    : 100;

  const csCount = eps180d.filter(e => e.contextual_safeguarding_risk).length;
  const openEps = eps180d.filter(e => e.status === "open").length;

  const episodeProfile: EpisodeProfile = {
    total_90d: eps90d.length,
    total_180d: eps180d.length,
    high_risk_count: highRisk.length,
    avg_duration_hours: avgDuration,
    longest_duration_hours: longestDuration,
    children_with_episodes: childrenWithEps,
    repeat_children: repeatChildren,
    police_reported_rate: policeRate,
    la_reported_rate: laRate,
    return_interview_rate: riRate,
    contextual_safeguarding_count: csCount,
    open_episodes: openEps,
  };

  // ── Pattern Profile ───────────────────────────────────────────────────
  let escalating = false;
  let concentratedChild: string | null = null;
  let concentratedCount = 0;

  if (Object.keys(childCounts).length > 0) {
    const sorted = Object.entries(childCounts).sort((a, b) => b[1] - a[1]);
    concentratedChild = sorted[0][0];
    concentratedCount = sorted[0][1];
  }

  // Check escalation: are recent episodes longer or more frequent?
  let trend: "improving" | "stable" | "worsening" | "insufficient_data" = "insufficient_data";
  if (eps180d.length >= 3) {
    const sortedEps = [...eps180d].sort((a, b) => a.date_missing.localeCompare(b.date_missing));
    const mid = Math.floor(sortedEps.length / 2);
    const firstHalf = sortedEps.slice(0, mid);
    const secondHalf = sortedEps.slice(mid);

    const avgDurFirst = firstHalf.reduce((s, e) => s + e.duration_hours, 0) / firstHalf.length;
    const avgDurSecond = secondHalf.reduce((s, e) => s + e.duration_hours, 0) / secondHalf.length;

    if (secondHalf.length > firstHalf.length && avgDurSecond > avgDurFirst) {
      escalating = true;
      trend = "worsening";
    } else if (secondHalf.length < firstHalf.length || avgDurSecond < avgDurFirst - 0.5) {
      trend = "improving";
    } else {
      trend = "stable";
    }
  } else if (eps180d.length >= 2) {
    const sortedEps = [...eps180d].sort((a, b) => a.date_missing.localeCompare(b.date_missing));
    if (sortedEps[sortedEps.length - 1].duration_hours > sortedEps[0].duration_hours + 1) {
      escalating = true;
      trend = "worsening";
    } else if (sortedEps[sortedEps.length - 1].duration_hours < sortedEps[0].duration_hours - 1) {
      trend = "improving";
    } else {
      trend = "stable";
    }
  }

  const patternProfile: PatternProfile = {
    escalating,
    concentrated_child: concentratedChild,
    concentrated_count: concentratedCount,
    trend,
  };

  // ── Scoring ───────────────────────────────────────────────────────────
  // Safety engine: base 75 (fewer episodes = better)
  let score = 75;

  // Episode volume (±20)
  if (eps90d.length === 0) score += 5;
  else if (eps90d.length <= 1) score -= 3;
  else if (eps90d.length <= 3) score -= 8;
  else score -= 15;

  // High risk episodes (±10)
  if (highRisk.length === 0) score += 3;
  else if (highRisk.length <= 1) score -= 3;
  else score -= 8;

  // Repeat children (±8)
  if (repeatChildren.length === 0) score += 3;
  else if (repeatChildren.length === 1) score -= 3;
  else score -= 6;

  // Duration (±5)
  if (longestDuration > 6) score -= 5;
  else if (longestDuration > 3) score -= 2;

  // Contextual safeguarding (±8)
  if (csCount === 0) score += 2;
  else if (csCount >= 2) score -= 6;
  else score -= 3;

  // Reporting compliance (±8)
  if (riRate === 100) score += 3;
  else if (riRate < 80) score -= 5;

  if (laRate === 100) score += 2;
  else if (laRate < 80) score -= 3;

  // Trend (±5)
  if (trend === "improving") score += 3;
  else if (trend === "worsening") score -= 5;

  // Open episodes
  if (openEps > 0) score -= 3;

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (eps90d.length === 0 && eps180d.length > 0) strengths.push("No missing episodes in the last 90 days — frequency has reduced.");
  if (riRate === 100 && eps180d.length > 0) strengths.push("100% return interview completion — every missing episode has been properly followed up.");
  if (laRate === 100 && eps180d.length > 0) strengths.push("100% LA notification rate — all episodes properly reported to the placing authority.");
  if (trend === "improving") strengths.push("Missing episodes are reducing in frequency or duration — interventions are working.");
  if (csCount === 0 && eps180d.length > 0) strengths.push("No contextual safeguarding risks identified — children are not at risk from external exploitation.");

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (eps90d.length >= 2) concerns.push(`${eps90d.length} missing episodes in the last 90 days — frequency requires intervention.`);
  if (highRisk.length > 0) concerns.push(`${highRisk.length} high-risk missing episode${highRisk.length > 1 ? "s" : ""} — these present significant safeguarding concerns.`);
  if (repeatChildren.length > 0) concerns.push(`${repeatChildren.length} child${repeatChildren.length > 1 ? "ren" : ""} with repeat missing episodes — patterns indicate unresolved triggers.`);
  if (csCount > 0) concerns.push(`${csCount} episode${csCount > 1 ? "s" : ""} with contextual safeguarding risk — external exploitation concerns require urgent attention.`);
  if (riRate < 100 && eps180d.length > 0) concerns.push(`Return interview completion at ${riRate}% — all children must have a return interview after every episode.`);
  if (escalating) concerns.push("Missing episodes are escalating in duration or frequency — intervention strategy needs review.");
  if (openEps > 0) concerns.push(`${openEps} missing episode${openEps > 1 ? "s" : ""} still open — ensure timely closure with documented outcomes.`);
  if (longestDuration > 4) concerns.push(`Longest episode was ${longestDuration} hours — extended absences increase safeguarding risk.`);

  // ── Recommendations ───────────────────────────────────────────────────
  const recs: MissingEpisodesRecommendation[] = [];
  let rank = 1;

  if (csCount > 0) {
    recs.push({ rank: rank++, recommendation: "Review contextual safeguarding strategy — ensure MACE referrals are active and safety plans are in place.", urgency: "immediate", regulatory_ref: "Reg 12" });
  }
  if (riRate < 100 && eps180d.length > 0) {
    recs.push({ rank: rank++, recommendation: "Complete all outstanding return interviews — these are a statutory requirement.", urgency: "immediate", regulatory_ref: "Reg 34" });
  }
  if (repeatChildren.length > 0) {
    recs.push({ rank: rank++, recommendation: "Develop targeted missing from care strategies for repeat children — identify and address root causes.", urgency: "soon", regulatory_ref: "Reg 12" });
  }
  if (escalating) {
    recs.push({ rank: rank++, recommendation: "Convene a strategy meeting to address escalating missing pattern — current interventions are not sufficient.", urgency: "immediate", regulatory_ref: "Reg 12" });
  }
  if (eps90d.length >= 3) {
    recs.push({ rank: rank++, recommendation: "Review risk assessments and safety plans for all children with missing episodes.", urgency: "soon", regulatory_ref: "Reg 12" });
  }
  if (policeRate < 100 && highRiskEps.length > 0) {
    recs.push({ rank: rank++, recommendation: "Ensure all medium/high risk missing episodes are reported to police in line with protocol.", urgency: "soon", regulatory_ref: "Reg 34" });
  }

  // ── Insights ──────────────────────────────────────────────────────────
  const insights: MissingEpisodesInsight[] = [];

  if (csCount >= 2) {
    insights.push({ text: `${csCount} episodes with contextual safeguarding risk. Ofsted will scrutinise the home's response to external exploitation — ensure MACE engagement, safety plans, and multi-agency working are all evidenced.`, severity: "critical" });
  }
  if (escalating) {
    insights.push({ text: "Missing episodes are escalating. This pattern suggests current strategies are not effective. Ofsted will ask what the home is doing differently in response.", severity: "critical" });
  }
  if (repeatChildren.length > 0 && concentratedCount >= 3) {
    insights.push({ text: `One child has ${concentratedCount} missing episodes — this concentration suggests child-specific triggers that need targeted intervention.`, severity: "critical" });
  }
  if (eps90d.length === 0 && eps180d.length > 0) {
    insights.push({ text: "No recent missing episodes despite historical pattern — the home's response strategy appears to be effective.", severity: "positive" });
  }
  if (riRate === 100 && laRate === 100 && eps180d.length > 0) {
    insights.push({ text: "Excellent procedural compliance: 100% return interviews and LA notifications. This evidences a robust missing from care protocol.", severity: "positive" });
  }
  if (eps180d.length <= 1 && total_children > 0) {
    insights.push({ text: "Very low missing episode rate relative to the number of children. This suggests good placement stability and engagement.", severity: "positive" });
  }
  if (trend === "improving" && eps180d.length >= 2) {
    insights.push({ text: "Missing episodes are trending downward — evidence that interventions are reducing risk.", severity: "positive" });
  }

  // ── Headline ──────────────────────────────────────────────────────────
  let headline: string;
  if (rating === "outstanding") {
    headline = eps180d.length === 0
      ? "No missing episodes — outstanding safeguarding and placement stability."
      : "Outstanding missing from care management — low frequency with excellent procedural compliance.";
  } else if (rating === "good") {
    headline = `Good missing from care management — ${eps90d.length} episode${eps90d.length !== 1 ? "s" : ""} in 90 days with ${riRate}% return interview completion.`;
  } else if (rating === "adequate") {
    headline = "Adequate missing from care response — improvements needed in frequency reduction or procedural compliance.";
  } else {
    headline = "Missing from care management is inadequate — pattern, frequency, or response requires urgent attention.";
  }

  return {
    missing_episodes_rating: rating,
    missing_episodes_score: score,
    headline,
    episodes: episodeProfile,
    pattern: patternProfile,
    strengths,
    concerns,
    recommendations: recs,
    insights,
  };
}

// ── Empty Defaults ──────────────────────────────────────────────────────────

function emptyEpisodes(): EpisodeProfile {
  return { total_90d: 0, total_180d: 0, high_risk_count: 0, avg_duration_hours: 0, longest_duration_hours: 0, children_with_episodes: [], repeat_children: [], police_reported_rate: 100, la_reported_rate: 100, return_interview_rate: 100, contextual_safeguarding_count: 0, open_episodes: 0 };
}

function emptyPattern(): PatternProfile {
  return { escalating: false, concentrated_child: null, concentrated_count: 0, trend: "insufficient_data" };
}
