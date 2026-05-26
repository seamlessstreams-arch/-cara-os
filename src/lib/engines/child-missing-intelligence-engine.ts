// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CHILD MISSING & RETURN INTELLIGENCE ENGINE
// Per-child engine analysing missing episodes: frequency, duration trends,
// risk escalation, return interview compliance, contextual safeguarding
// risks, patterns, and professional response quality.
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
// Injectable `today` parameter for deterministic testing.
//
// Regulatory: CHR 2015 Reg 12 (health & safety), Reg 34 (welfare),
// Missing from care and home protocols (DfE statutory guidance).
// SCCIF: "Safety of children", "Children missing from care."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface MissingEpisodeInput {
  id: string;
  date: string;              // date_missing
  time: string;              // time_missing
  duration_hours: number | null;
  risk_level: string;        // low, medium, high, critical
  reported_to_police: boolean;
  reported_to_la: boolean;
  return_interview_completed: boolean;
  return_interview_date: string | null;
  contextual_safeguarding_risk: boolean;
  status: string;            // active, returned, closed
  pattern_notes: string | null;
}

export interface ChildMissingInput {
  today: string;
  child_id: string;
  child_name: string;
  episodes: MissingEpisodeInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type MissingRiskLevel = "high_risk" | "elevated" | "managed" | "low" | "no_episodes";

export interface FrequencyProfile {
  total_episodes: number;
  episodes_90d: number;
  episodes_180d: number;
  episodes_365d: number;
  trend: "increasing" | "stable" | "decreasing" | "insufficient_data";
}

export interface DurationProfile {
  avg_duration_hours: number;
  max_duration_hours: number;
  min_duration_hours: number;
  duration_trend: "increasing" | "stable" | "decreasing" | "insufficient_data";
}

export interface RiskProfile {
  current_risk_level: string;
  highest_ever_risk: string;
  risk_escalating: boolean;
  contextual_safeguarding_episodes: number;
  police_involved_count: number;
  la_notified_count: number;
}

export interface ResponseQuality {
  return_interview_rate: number;     // % of returned episodes with RI completed
  avg_ri_delay_days: number;         // avg days between return and RI
  police_reporting_rate: number;     // % reported to police when high/critical
  la_notification_rate: number;      // % notified to LA
}

export interface MissingPattern {
  text: string;
  severity: "critical" | "warning" | "info";
}

export interface MissingRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  domain: string;
  regulatory_ref: string;
}

export interface MissingInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface ChildMissingResult {
  generated_at: string;
  child_id: string;
  child_name: string;
  missing_risk: MissingRiskLevel;
  missing_risk_score: number;        // 0-100 (higher = more concern)
  headline: string;
  frequency: FrequencyProfile;
  duration: DurationProfile;
  risk: RiskProfile;
  response_quality: ResponseQuality;
  patterns: MissingPattern[];
  is_currently_missing: boolean;
  strengths: string[];
  concerns: string[];
  recommendations: MissingRecommendation[];
  insights: MissingInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function daysAgo(today: string, date: string): number {
  return Math.round(
    (new Date(today).getTime() - new Date(date).getTime()) / 86_400_000,
  );
}

function isWithin(today: string, date: string, days: number): boolean {
  const da = daysAgo(today, date);
  return da >= 0 && da <= days;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function avg(values: number[]): number {
  return values.length > 0 ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10 : 0;
}

function pct(n: number, d: number): number {
  return d > 0 ? Math.round((n / d) * 100) : 0;
}

const RISK_ORDER: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

function riskValue(level: string): number {
  return RISK_ORDER[level] ?? 0;
}

function maxRisk(levels: string[]): string {
  if (levels.length === 0) return "low";
  return levels.reduce((a, b) => riskValue(a) >= riskValue(b) ? a : b, levels[0]);
}

// ── Main Computation ────────────────────────────────────────────────────────

export function computeChildMissing(
  input: ChildMissingInput,
): ChildMissingResult {
  const { today, child_id, child_name, episodes } = input;

  // Sort by date descending (most recent first)
  const sorted = [...episodes].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const ep90d = sorted.filter((e) => isWithin(today, e.date, 90));
  const ep180d = sorted.filter((e) => isWithin(today, e.date, 180));
  const ep365d = sorted.filter((e) => isWithin(today, e.date, 365));

  // Currently missing?
  const is_currently_missing = sorted.some((e) => e.status === "active");

  // ── Frequency Profile ────────────────────────────────────────────────
  // Trend: compare last 90d vs previous 90d
  const recent90d = sorted.filter((e) => isWithin(today, e.date, 90));
  const older90d = sorted.filter((e) => {
    const da = daysAgo(today, e.date);
    return da > 90 && da <= 180;
  });

  let frequencyTrend: FrequencyProfile["trend"];
  if (episodes.length < 2) {
    frequencyTrend = "insufficient_data";
  } else if (recent90d.length > older90d.length + 1) {
    frequencyTrend = "increasing";
  } else if (recent90d.length < older90d.length - 1) {
    frequencyTrend = "decreasing";
  } else {
    frequencyTrend = "stable";
  }

  const frequency: FrequencyProfile = {
    total_episodes: episodes.length,
    episodes_90d: ep90d.length,
    episodes_180d: ep180d.length,
    episodes_365d: ep365d.length,
    trend: frequencyTrend,
  };

  // ── Duration Profile ─────────────────────────────────────────────────
  const durations = episodes
    .filter((e) => typeof e.duration_hours === "number" && e.duration_hours > 0)
    .map((e) => e.duration_hours as number);

  // Duration trend: compare avg of last 3 vs avg of prior 3
  const recentDurations = sorted
    .filter((e) => typeof e.duration_hours === "number" && e.duration_hours! > 0)
    .slice(0, 3)
    .map((e) => e.duration_hours as number);
  const olderDurations = sorted
    .filter((e) => typeof e.duration_hours === "number" && e.duration_hours! > 0)
    .slice(3, 6)
    .map((e) => e.duration_hours as number);

  let durationTrend: DurationProfile["duration_trend"];
  if (durations.length < 2) {
    durationTrend = "insufficient_data";
  } else if (recentDurations.length >= 2 && olderDurations.length >= 1 && avg(recentDurations) > avg(olderDurations) + 0.5) {
    durationTrend = "increasing";
  } else if (recentDurations.length >= 2 && olderDurations.length >= 1 && avg(recentDurations) < avg(olderDurations) - 0.5) {
    durationTrend = "decreasing";
  } else {
    durationTrend = "stable";
  }

  const duration: DurationProfile = {
    avg_duration_hours: avg(durations),
    max_duration_hours: durations.length > 0 ? Math.max(...durations) : 0,
    min_duration_hours: durations.length > 0 ? Math.min(...durations) : 0,
    duration_trend: durationTrend,
  };

  // ── Risk Profile ─────────────────────────────────────────────────────
  const riskLevels = episodes.map((e) => e.risk_level);
  const mostRecentRisk = sorted.length > 0 ? sorted[0].risk_level : "low";
  const highestRisk = maxRisk(riskLevels);
  const csEpisodes = episodes.filter((e) => e.contextual_safeguarding_risk);
  const policeCount = episodes.filter((e) => e.reported_to_police);
  const laCount = episodes.filter((e) => e.reported_to_la);

  // Risk escalating: recent episodes have higher risk than older ones
  const recentRisks = sorted.slice(0, 2).map((e) => riskValue(e.risk_level));
  const olderRisks = sorted.slice(2, 4).map((e) => riskValue(e.risk_level));
  const riskEscalating = recentRisks.length >= 1 && olderRisks.length >= 1
    ? avg(recentRisks) > avg(olderRisks) + 0.3
    : false;

  const risk: RiskProfile = {
    current_risk_level: mostRecentRisk,
    highest_ever_risk: highestRisk,
    risk_escalating: riskEscalating,
    contextual_safeguarding_episodes: csEpisodes.length,
    police_involved_count: policeCount.length,
    la_notified_count: laCount.length,
  };

  // ── Response Quality ─────────────────────────────────────────────────
  const returnedEpisodes = sorted.filter((e) => e.status === "returned" || e.status === "closed");
  const riCompleted = returnedEpisodes.filter((e) => e.return_interview_completed);

  // RI delay calculation
  const riDelays: number[] = [];
  for (const ep of riCompleted) {
    if (ep.return_interview_date) {
      const delay = daysAgo(ep.return_interview_date, ep.date);
      if (delay >= 0) riDelays.push(Math.abs(delay));
    }
  }

  const highCritical = episodes.filter((e) => e.risk_level === "high" || e.risk_level === "critical");
  const policeForHighRisk = highCritical.filter((e) => e.reported_to_police);

  const response_quality: ResponseQuality = {
    return_interview_rate: pct(riCompleted.length, returnedEpisodes.length),
    avg_ri_delay_days: avg(riDelays),
    police_reporting_rate: pct(policeForHighRisk.length, highCritical.length),
    la_notification_rate: pct(laCount.length, returnedEpisodes.length),
  };

  // ── Patterns ─────────────────────────────────────────────────────────
  const patterns: MissingPattern[] = [];

  if (episodes.length >= 3 && frequencyTrend === "increasing") {
    patterns.push({
      text: "Frequency of missing episodes is increasing. This escalating pattern requires urgent multi-agency response.",
      severity: "critical",
    });
  }

  if (durationTrend === "increasing" && durations.length >= 3) {
    patterns.push({
      text: "Duration of missing episodes is increasing. Longer absences increase risk exposure and may indicate deepening involvement with exploitative networks.",
      severity: "critical",
    });
  }

  if (csEpisodes.length >= 2) {
    patterns.push({
      text: `${csEpisodes.length} episodes flagged with contextual safeguarding risks. Pattern suggests potential exploitation — requires strategy discussion and NRM consideration.`,
      severity: "critical",
    });
  }

  if (riskEscalating) {
    patterns.push({
      text: "Risk level is escalating across recent episodes. Each subsequent episode is assessed as higher risk than the last.",
      severity: "critical",
    });
  }

  // Time-of-day pattern
  const eveningEpisodes = episodes.filter((e) => {
    const hour = parseInt(e.time.split(":")[0], 10);
    return hour >= 18 || hour < 6;
  });
  if (eveningEpisodes.length >= 2 && eveningEpisodes.length === episodes.length) {
    patterns.push({
      text: "All missing episodes occur in the evening or overnight. Consider whether evening routines, boredom, or peer influence are contributing factors.",
      severity: "warning",
    });
  }

  if (episodes.length === 1) {
    patterns.push({
      text: "Single isolated episode. Monitor closely and use the return interview to understand triggers and prevent recurrence.",
      severity: "info",
    });
  }

  // ── Risk Score (0-100, higher = more concern) ────────────────────────
  let riskScore = 0; // Start at zero — no episodes = no concern

  // Frequency
  if (ep90d.length >= 4) riskScore += 30;
  else if (ep90d.length >= 2) riskScore += 20;
  else if (ep90d.length >= 1) riskScore += 10;
  if (episodes.length >= 5) riskScore += 10;

  // Risk level
  if (highestRisk === "critical") riskScore += 20;
  else if (highestRisk === "high") riskScore += 15;
  else if (highestRisk === "medium") riskScore += 8;

  // Trend
  if (frequencyTrend === "increasing") riskScore += 10;
  if (durationTrend === "increasing") riskScore += 5;
  if (riskEscalating) riskScore += 10;

  // Contextual safeguarding
  if (csEpisodes.length >= 2) riskScore += 15;
  else if (csEpisodes.length >= 1) riskScore += 8;

  // Currently missing
  if (is_currently_missing) riskScore += 15;

  // Response quality mitigations
  if (response_quality.return_interview_rate === 100 && returnedEpisodes.length > 0) riskScore -= 5;
  if (response_quality.return_interview_rate < 50 && returnedEpisodes.length >= 2) riskScore += 10;

  riskScore = clamp(riskScore, 0, 100);

  const missing_risk: MissingRiskLevel =
    episodes.length === 0 ? "no_episodes" :
    riskScore >= 60 ? "high_risk" :
    riskScore >= 40 ? "elevated" :
    riskScore >= 20 ? "managed" :
    "low";

  // ── Headline ──────────────────────────────────────────────────────────
  const parts: string[] = [];
  if (is_currently_missing) parts.push("CURRENTLY MISSING");
  parts.push(`Missing risk: ${missing_risk.replace("_", " ")}`);
  if (episodes.length > 0) parts.push(`${episodes.length} episode${episodes.length !== 1 ? "s" : ""} total`);
  if (ep90d.length > 0) parts.push(`${ep90d.length} in last 90d`);
  if (csEpisodes.length > 0) parts.push(`${csEpisodes.length} CS flagged`);
  const headline = parts.join(". ") + ".";

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];

  if (episodes.length === 0) {
    strengths.push("No missing episodes recorded. The child appears settled and engaged with the placement. Maintain positive relationships and engaging activities to prevent disengagement.");
  }

  if (response_quality.return_interview_rate === 100 && returnedEpisodes.length >= 2) {
    strengths.push(`Return interviews completed for 100% of episodes. This demonstrates strong professional response and commitment to understanding what drives missing behaviour.`);
  }

  if (response_quality.police_reporting_rate === 100 && highCritical.length >= 1) {
    strengths.push("All high/critical risk episodes were reported to police. Appropriate statutory notifications protect the child and demonstrate proper escalation protocols.");
  }

  if (response_quality.la_notification_rate === 100 && returnedEpisodes.length >= 1) {
    strengths.push("Local authority notified for all episodes. Good inter-agency communication is essential for coordinated safeguarding responses.");
  }

  if (frequencyTrend === "decreasing" && episodes.length >= 3) {
    strengths.push("Missing episode frequency is decreasing. Interventions appear to be having a positive impact. Continue current approach and maintain close monitoring.");
  }

  if (episodes.length >= 1 && ep90d.length === 0) {
    strengths.push("No missing episodes in the last 90 days. The child appears more settled — a positive trajectory. Continue the current care approach and remain vigilant.");
  }

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];

  if (is_currently_missing) {
    concerns.push("CHILD IS CURRENTLY MISSING. All protocols must be activated: police notification, LA notification, risk assessment review, and staff search as appropriate.");
  }

  if (frequencyTrend === "increasing" && episodes.length >= 3) {
    concerns.push("Missing episodes are increasing in frequency. This escalating pattern suggests that current interventions are insufficient. An urgent multi-agency strategy discussion is needed.");
  }

  if (durationTrend === "increasing" && durations.length >= 3) {
    concerns.push("Duration of missing episodes is increasing. Longer absences create greater risk of harm, exploitation, or substance use. Consider whether the child is being coerced or groomed.");
  }

  if (csEpisodes.length >= 2) {
    concerns.push(`${csEpisodes.length} episodes flagged as contextual safeguarding risks. Suspected exploitation or harmful associations require a formal CS assessment, strategy discussion, and NRM referral consideration.`);
  }

  if (riskEscalating) {
    concerns.push("Risk level is escalating across episodes. Each new episode is assessed as higher risk — the protective factors are diminishing and the child is becoming more vulnerable.");
  }

  if (response_quality.return_interview_rate < 100 && returnedEpisodes.length >= 2) {
    concerns.push(`Return interviews completed for only ${response_quality.return_interview_rate}% of episodes. Every return must include an independent RI within 72 hours — this is statutory guidance.`);
  }

  // ── Recommendations ───────────────────────────────────────────────────
  const recommendations: MissingRecommendation[] = [];
  let rank = 0;

  if (is_currently_missing) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Activate missing person protocols immediately. Ensure police are notified, LA is informed, and a risk assessment is reviewed. Deploy staff search if safe to do so.",
      urgency: "immediate",
      domain: "safeguarding",
      regulatory_ref: "Reg 12",
    });
  }

  if (csEpisodes.length >= 2) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Request a multi-agency strategy discussion focusing on contextual safeguarding. Consider NRM referral, CE mapping, and police intelligence sharing.",
      urgency: "immediate",
      domain: "exploitation",
      regulatory_ref: "Reg 12",
    });
  }

  if (frequencyTrend === "increasing" && episodes.length >= 3) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Review the missing from care risk assessment and safety plan. Current interventions are not reducing frequency — a new approach is needed, potentially including trigger mapping, relationship-based interventions, and environmental changes.",
      urgency: "soon",
      domain: "prevention",
      regulatory_ref: "Reg 34",
    });
  }

  if (response_quality.return_interview_rate < 100 && returnedEpisodes.length >= 2) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Ensure every return from a missing episode includes an independent return interview within 72 hours. Record the interview, document any disclosures, and update the risk assessment.",
      urgency: "soon",
      domain: "compliance",
      regulatory_ref: "Reg 36",
    });
  }

  if (episodes.length >= 1 && episodes.length <= 2 && !is_currently_missing) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Use key work sessions to explore what triggered the missing episode(s). Build a personalised 'staying safe' plan with the child, identifying trusted adults and safe alternatives.",
      urgency: "planned",
      domain: "prevention",
      regulatory_ref: "Reg 34",
    });
  }

  // ── ARIA Insights ─────────────────────────────────────────────────────
  const insights: MissingInsight[] = [];

  if (missing_risk === "high_risk") {
    insights.push({
      severity: "critical",
      text: `${child_name} is assessed as high risk for missing episodes (risk score: ${riskScore}%). The pattern of episodes suggests significant vulnerability. Ofsted will scrutinise how the home is responding to this pattern — ensure multi-agency involvement, robust safety planning, and clear documentation of every intervention.`,
    });
  }

  if (csEpisodes.length >= 2 && riskEscalating) {
    insights.push({
      severity: "critical",
      text: `Contextual safeguarding concerns are escalating for ${child_name}. The combination of repeated missing episodes and CS flags is a serious indicator of potential exploitation. MASH referral, CE mapping, and NRM consideration should be prioritised.`,
    });
  }

  if (episodes.length === 0) {
    insights.push({
      severity: "positive",
      text: `${child_name} has no missing episodes. A settled child who does not go missing demonstrates a positive placement experience — they feel safe, connected, and engaged with the home.`,
    });
  }

  if (frequencyTrend === "decreasing" && episodes.length >= 3) {
    insights.push({
      severity: "positive",
      text: `Missing episodes are decreasing for ${child_name}. This is a strong indicator that interventions are working — the child is becoming more settled and the relationship with the home is strengthening.`,
    });
  }

  if (response_quality.return_interview_rate === 100 && response_quality.la_notification_rate === 100 && episodes.length >= 2) {
    insights.push({
      severity: "positive",
      text: "Professional response to missing episodes is exemplary: 100% return interview completion and full LA notification. This demonstrates strong safeguarding practice and will be viewed positively by inspectors.",
    });
  }

  return {
    generated_at: today,
    child_id,
    child_name,
    missing_risk,
    missing_risk_score: riskScore,
    headline,
    frequency,
    duration,
    risk,
    response_quality,
    patterns,
    is_currently_missing,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
