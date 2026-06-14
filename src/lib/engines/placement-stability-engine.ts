// ══════════════════════════════════════════════════════════════════════════════
// CARA — PLACEMENT STABILITY INTELLIGENCE ENGINE
//
// Pure deterministic engine that aggregates child data, daily logs, incidents,
// missing episodes, keyworking sessions, and outcome targets to produce:
// - Per-child stability profile (duration, mood trends, incident rate)
// - Overall home stability metrics
// - Disruption risk indicators per child
// - Wellbeing trajectory analysis (mood scores over time)
// - Protective factors and risk factors
// - Auto-generated Cara placement intelligence insights (deterministic)
//
// Key regulatory requirements:
//   Reg 5  — Engaging children (welfare paramount)
//   Reg 12 — The protection of children (avoiding harmful moves)
//   Reg 14 — Assessment of young people (matching, stability)
//   SCCIF: "Children make progress" / "Experiences and progress of children"
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ───────────────────────────────────────────────────────────────────

export interface ChildInput {
  id: string;
  first_name: string;
  preferred_name: string | null;
  date_of_birth: string;
  placement_start: string;
  placement_end: string | null;
  key_worker_id: string | null;
  risk_flags: string[];
  status: string; // current, planned, ended
}

export interface DailyLogInput {
  id: string;
  child_id: string;
  date: string;
  mood_score: number | null; // 1-10
  entry_type: string;
  is_significant: boolean;
}

export interface IncidentInput {
  id: string;
  child_id: string;
  date: string;
  type: string;
  severity: string;
}

export interface MissingEpisodeInput {
  id: string;
  child_id: string;
  date_missing: string;
  status: string;
  risk_level: string;
}

export interface KeyworkSessionInput {
  id: string;
  child_id: string;
  date: string;
  mood_before: number; // 1-5
  mood_after: number; // 1-5
  type: string;
}

export interface OutcomeTargetInput {
  id: string;
  child_id: string;
  domain: string;
  direction: string; // improving, stable, declining, not_started
  current_rating: number;
  target_rating: number;
  baseline_rating: number;
  status: string;
}

// ── Output Types ────────────────────────────────────────────────────────────

export interface ChildStabilityProfile {
  child_id: string;
  child_name: string;
  age: number;
  placement_days: number;
  stability_score: number; // 0-100
  stability_level: "excellent" | "good" | "moderate" | "at_risk" | "critical";
  avg_mood_recent: number | null; // last 14 days
  mood_trend: "improving" | "stable" | "declining" | "insufficient_data";
  incident_count_30d: number;
  missing_count_30d: number;
  keywork_count_30d: number;
  outcome_progress: number; // percentage of targets improving/achieved
  risk_factors: string[];
  protective_factors: string[];
}

export interface HomeStabilityMetrics {
  total_children: number;
  average_placement_days: number;
  average_stability_score: number;
  children_at_risk: number;
  children_critical: number;
  avg_mood_home: number | null;
  incident_rate_per_child_30d: number;
  keywork_frequency_per_child_30d: number;
  placement_breakdown_risk: number; // percentage at moderate or below
}

export interface WellbeingDataPoint {
  date: string;
  avg_mood: number;
  child_count: number;
}

export interface DisruptionIndicator {
  child_id: string;
  child_name: string;
  indicator: string;
  severity: "high" | "medium" | "low";
  detail: string;
}

export interface CaraInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface PlacementStabilityResult {
  children: ChildStabilityProfile[];
  home_metrics: HomeStabilityMetrics;
  wellbeing_trend: WellbeingDataPoint[];
  disruption_indicators: DisruptionIndicator[];
  insights: CaraInsight[];
}

export interface PlacementStabilityInput {
  children: ChildInput[];
  dailyLogs: DailyLogInput[];
  incidents: IncidentInput[];
  missingEpisodes: MissingEpisodeInput[];
  keyworkSessions: KeyworkSessionInput[];
  outcomeTargets: OutcomeTargetInput[];
  today?: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b + "T00:00:00Z").getTime() - new Date(a + "T00:00:00Z").getTime()) / 86_400_000
  );
}

export function computeAge(dob: string, today: string): number {
  const birth = new Date(dob + "T00:00:00Z");
  const now = new Date(today + "T00:00:00Z");
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

/** Compute stability score (0-100) from multiple indicators */
export function computeStabilityScore(params: {
  placementDays: number;
  avgMood: number | null;
  incidentCount30d: number;
  missingCount30d: number;
  keyworkCount30d: number;
  outcomeProgress: number;
  riskFlagCount: number;
}): number {
  let score = 50; // Base score

  // Duration bonus (longer = more stable, up to +20)
  if (params.placementDays >= 365) score += 20;
  else if (params.placementDays >= 180) score += 15;
  else if (params.placementDays >= 90) score += 10;
  else if (params.placementDays >= 30) score += 5;

  // Mood contribution (up to +15)
  if (params.avgMood != null) {
    if (params.avgMood >= 7) score += 15;
    else if (params.avgMood >= 5) score += 10;
    else if (params.avgMood >= 3) score += 5;
    else score -= 5;
  }

  // Incident impact (up to -25)
  if (params.incidentCount30d === 0) score += 10;
  else if (params.incidentCount30d <= 1) score -= 5;
  else if (params.incidentCount30d <= 3) score -= 15;
  else score -= 25;

  // Missing episodes impact (up to -20)
  if (params.missingCount30d === 0) score += 5;
  else if (params.missingCount30d === 1) score -= 10;
  else score -= 20;

  // Keywork engagement bonus (up to +10)
  if (params.keyworkCount30d >= 4) score += 10;
  else if (params.keyworkCount30d >= 2) score += 5;
  else if (params.keyworkCount30d === 0) score -= 5;

  // Outcome progress (up to +10)
  if (params.outcomeProgress >= 75) score += 10;
  else if (params.outcomeProgress >= 50) score += 5;
  else if (params.outcomeProgress < 25 && params.outcomeProgress > 0) score -= 5;

  // Risk flags impact (up to -10)
  if (params.riskFlagCount >= 3) score -= 10;
  else if (params.riskFlagCount >= 2) score -= 5;

  return Math.max(0, Math.min(100, score));
}

/** Classify stability level from score */
export function classifyStabilityLevel(score: number): ChildStabilityProfile["stability_level"] {
  if (score >= 80) return "excellent";
  if (score >= 65) return "good";
  if (score >= 45) return "moderate";
  if (score >= 25) return "at_risk";
  return "critical";
}

/** Compute mood trend from recent vs older period */
export function computeMoodTrend(
  recentMoods: number[],
  olderMoods: number[],
): "improving" | "stable" | "declining" | "insufficient_data" {
  if (recentMoods.length < 2 && olderMoods.length < 2) return "insufficient_data";
  if (olderMoods.length === 0) return recentMoods.length >= 2 ? "stable" : "insufficient_data";
  if (recentMoods.length === 0) return "insufficient_data";

  const recentAvg = recentMoods.reduce((a, b) => a + b, 0) / recentMoods.length;
  const olderAvg = olderMoods.reduce((a, b) => a + b, 0) / olderMoods.length;

  const diff = recentAvg - olderAvg;
  if (diff > 0.8) return "improving";
  if (diff < -0.8) return "declining";
  return "stable";
}

// ── Main Engine ─────────────────────────────────────────────────────────────

export function computePlacementStability(input: PlacementStabilityInput): PlacementStabilityResult {
  const today = input.today ?? todayStr();
  const { children, dailyLogs, incidents, missingEpisodes, keyworkSessions, outcomeTargets } = input;

  const currentChildren = children.filter((c) => c.status === "current");

  const thirtyDaysAgo = (() => {
    const d = new Date(today + "T00:00:00Z");
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  })();

  const fourteenDaysAgo = (() => {
    const d = new Date(today + "T00:00:00Z");
    d.setDate(d.getDate() - 14);
    return d.toISOString().slice(0, 10);
  })();

  const twentyEightDaysAgo = (() => {
    const d = new Date(today + "T00:00:00Z");
    d.setDate(d.getDate() - 28);
    return d.toISOString().slice(0, 10);
  })();

  // ── Per-child stability profiles ──────────────────────────────────────
  const childProfiles: ChildStabilityProfile[] = [];

  for (const child of currentChildren) {
    const childName = child.preferred_name ?? child.first_name;
    const age = computeAge(child.date_of_birth, today);
    const placementDays = Math.max(0, daysBetween(child.placement_start, today));

    // Daily logs for this child
    const childLogs = dailyLogs.filter((l) => l.child_id === child.id);
    const recentLogs = childLogs.filter((l) => l.date >= fourteenDaysAgo);
    const olderLogs = childLogs.filter((l) => l.date >= twentyEightDaysAgo && l.date < fourteenDaysAgo);

    const recentMoods = recentLogs.filter((l) => l.mood_score != null).map((l) => l.mood_score!);
    const olderMoods = olderLogs.filter((l) => l.mood_score != null).map((l) => l.mood_score!);
    const avgMoodRecent = recentMoods.length > 0
      ? Math.round((recentMoods.reduce((a, b) => a + b, 0) / recentMoods.length) * 10) / 10
      : null;

    const moodTrend = computeMoodTrend(recentMoods, olderMoods);

    // Incidents (last 30 days). Bound both ends — an unbounded `>= thirtyDaysAgo`
    // counts future-dated records (data-entry typos, sessions logged ahead).
    const childIncidents30d = incidents.filter(
      (i) => i.child_id === child.id && i.date >= thirtyDaysAgo && i.date <= today
    ).length;

    // Missing episodes (last 30 days)
    const childMissing30d = missingEpisodes.filter(
      (m) => m.child_id === child.id && m.date_missing >= thirtyDaysAgo && m.date_missing <= today
    ).length;

    // Keywork sessions (last 30 days)
    const childKeywork30d = keyworkSessions.filter(
      (k) => k.child_id === child.id && k.date >= thirtyDaysAgo && k.date <= today
    ).length;

    // Outcome targets progress
    const childTargets = outcomeTargets.filter(
      (t) => t.child_id === child.id && t.status === "active"
    );
    const improvingTargets = childTargets.filter(
      (t) => t.direction === "improving" || t.current_rating >= t.target_rating
    ).length;
    const outcomeProgress = childTargets.length > 0
      ? Math.round((improvingTargets / childTargets.length) * 100)
      : 50; // neutral if no targets

    // Risk factors
    const riskFactors: string[] = [...child.risk_flags];
    if (childIncidents30d >= 3) riskFactors.push("High incident frequency");
    if (childMissing30d >= 2) riskFactors.push("Repeat missing episodes");
    if (moodTrend === "declining") riskFactors.push("Declining mood trend");
    if (childKeywork30d === 0 && placementDays > 14) riskFactors.push("No keywork in 30 days");
    if (placementDays < 28) riskFactors.push("Early placement (< 4 weeks)");

    // Protective factors
    const protectiveFactors: string[] = [];
    if (avgMoodRecent != null && avgMoodRecent >= 7) protectiveFactors.push("Consistently positive mood");
    if (childKeywork30d >= 4) protectiveFactors.push("Regular keywork engagement");
    if (childIncidents30d === 0) protectiveFactors.push("Incident-free this month");
    if (childMissing30d === 0) protectiveFactors.push("No missing episodes");
    if (moodTrend === "improving") protectiveFactors.push("Improving mood trajectory");
    if (outcomeProgress >= 75) protectiveFactors.push("Strong outcome progress");
    if (placementDays >= 180) protectiveFactors.push("Well-established placement");
    if (child.key_worker_id) protectiveFactors.push("Allocated key worker");

    // Compute stability score
    const stabilityScore = computeStabilityScore({
      placementDays,
      avgMood: avgMoodRecent,
      incidentCount30d: childIncidents30d,
      missingCount30d: childMissing30d,
      keyworkCount30d: childKeywork30d,
      outcomeProgress,
      riskFlagCount: child.risk_flags.length,
    });

    childProfiles.push({
      child_id: child.id,
      child_name: childName,
      age,
      placement_days: placementDays,
      stability_score: stabilityScore,
      stability_level: classifyStabilityLevel(stabilityScore),
      avg_mood_recent: avgMoodRecent,
      mood_trend: moodTrend,
      incident_count_30d: childIncidents30d,
      missing_count_30d: childMissing30d,
      keywork_count_30d: childKeywork30d,
      outcome_progress: outcomeProgress,
      risk_factors: riskFactors,
      protective_factors: protectiveFactors,
    });
  }

  // Sort by stability score (lowest/most-at-risk first)
  childProfiles.sort((a, b) => a.stability_score - b.stability_score);

  // ── Home metrics ──────────────────────────────────────────────────────
  const avgPlacementDays = childProfiles.length > 0
    ? Math.round(childProfiles.reduce((sum, c) => sum + c.placement_days, 0) / childProfiles.length)
    : 0;

  const avgStabilityScore = childProfiles.length > 0
    ? Math.round(childProfiles.reduce((sum, c) => sum + c.stability_score, 0) / childProfiles.length)
    : 0;

  const moods = childProfiles.filter((c) => c.avg_mood_recent != null).map((c) => c.avg_mood_recent!);
  const avgMoodHome = moods.length > 0
    ? Math.round((moods.reduce((a, b) => a + b, 0) / moods.length) * 10) / 10
    : null;

  const atRisk = childProfiles.filter((c) => c.stability_level === "at_risk").length;
  const critical = childProfiles.filter((c) => c.stability_level === "critical").length;

  const totalIncidents30d = childProfiles.reduce((sum, c) => sum + c.incident_count_30d, 0);
  const incidentRate = childProfiles.length > 0
    ? Math.round((totalIncidents30d / childProfiles.length) * 10) / 10
    : 0;

  const totalKeywork30d = childProfiles.reduce((sum, c) => sum + c.keywork_count_30d, 0);
  const keyworkFrequency = childProfiles.length > 0
    ? Math.round((totalKeywork30d / childProfiles.length) * 10) / 10
    : 0;

  const atModerateOrBelow = childProfiles.filter(
    (c) => c.stability_level === "moderate" || c.stability_level === "at_risk" || c.stability_level === "critical"
  ).length;
  const breakdownRisk = childProfiles.length > 0
    ? Math.round((atModerateOrBelow / childProfiles.length) * 100)
    : 0;

  const homeMetrics: HomeStabilityMetrics = {
    total_children: currentChildren.length,
    average_placement_days: avgPlacementDays,
    average_stability_score: avgStabilityScore,
    children_at_risk: atRisk,
    children_critical: critical,
    avg_mood_home: avgMoodHome,
    incident_rate_per_child_30d: incidentRate,
    keywork_frequency_per_child_30d: keyworkFrequency,
    placement_breakdown_risk: breakdownRisk,
  };

  // ── Wellbeing trend (last 14 days, daily averages) ─────────────────────
  const wellbeingTrend: WellbeingDataPoint[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today + "T00:00:00Z");
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);

    const dayLogs = dailyLogs.filter(
      (l) => l.date === dateStr && l.mood_score != null
    );
    if (dayLogs.length > 0) {
      const avgMood = Math.round(
        (dayLogs.reduce((sum, l) => sum + l.mood_score!, 0) / dayLogs.length) * 10
      ) / 10;
      wellbeingTrend.push({
        date: dateStr,
        avg_mood: avgMood,
        child_count: new Set(dayLogs.map((l) => l.child_id)).size,
      });
    }
  }

  // ── Disruption indicators ──────────────────────────────────────────────
  const disruptionIndicators: DisruptionIndicator[] = [];

  for (const child of childProfiles) {
    // Multiple missing episodes
    if (child.missing_count_30d >= 2) {
      disruptionIndicators.push({
        child_id: child.child_id,
        child_name: child.child_name,
        indicator: "repeat_missing",
        severity: "high",
        detail: `${child.missing_count_30d} missing episodes in 30 days. Pattern may indicate placement dissatisfaction or external pull factors.`,
      });
    }

    // A single high/critical-risk missing episode is itself a disruption/CSE
    // indicator — repeat_missing only fires at >= 2, so one high-risk episode
    // (the canonical exploitation signal) would otherwise not surface per-child.
    const highRiskMissing30d = missingEpisodes.filter(
      (m) => m.child_id === child.child_id && m.date_missing >= thirtyDaysAgo && m.date_missing <= today
        && (m.risk_level === "high" || m.risk_level === "critical"),
    ).length;
    if (highRiskMissing30d >= 1 && child.missing_count_30d < 2) {
      disruptionIndicators.push({
        child_id: child.child_id,
        child_name: child.child_name,
        indicator: "high_risk_missing",
        severity: "high",
        detail: `${highRiskMissing30d} high/critical-risk missing episode${highRiskMissing30d > 1 ? "s" : ""} in 30 days — review the risk assessment and contextual-safeguarding response.`,
      });
    }

    // High incident rate
    if (child.incident_count_30d >= 3) {
      disruptionIndicators.push({
        child_id: child.child_id,
        child_name: child.child_name,
        indicator: "high_incidents",
        severity: child.incident_count_30d >= 5 ? "high" : "medium",
        detail: `${child.incident_count_30d} incidents in 30 days. Review BSP and placement suitability.`,
      });
    }

    // Declining mood
    if (child.mood_trend === "declining") {
      disruptionIndicators.push({
        child_id: child.child_id,
        child_name: child.child_name,
        indicator: "declining_mood",
        severity: "medium",
        detail: "Mood scores declining over past 14 days. Explore causes in next keywork session.",
      });
    }

    // No keywork engagement
    if (child.keywork_count_30d === 0 && child.placement_days > 14) {
      disruptionIndicators.push({
        child_id: child.child_id,
        child_name: child.child_name,
        indicator: "no_keywork",
        severity: "medium",
        detail: "No keywork sessions in 30 days. Reg 5 requires meaningful engagement with each child.",
      });
    }

    // Early placement fragility
    if (child.placement_days < 28 && child.incident_count_30d >= 2) {
      disruptionIndicators.push({
        child_id: child.child_id,
        child_name: child.child_name,
        indicator: "early_placement_fragility",
        severity: "high",
        detail: `Only ${child.placement_days} days in placement with ${child.incident_count_30d} incidents. High disruption risk during settling period.`,
      });
    }
  }

  // Sort by severity
  const sevOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  disruptionIndicators.sort((a, b) => (sevOrder[a.severity] ?? 3) - (sevOrder[b.severity] ?? 3));

  // ── Cara Intelligence Insights ─────────────────────────────────────────
  const insights: CaraInsight[] = [];

  if (currentChildren.length === 0) {
    insights.push({
      severity: "positive",
      text: "No current placements to assess. Placement stability engine ready for when children are admitted.",
    });
    return { children: childProfiles, home_metrics: homeMetrics, wellbeing_trend: wellbeingTrend, disruption_indicators: disruptionIndicators, insights };
  }

  // Critical/at-risk children
  if (critical > 0) {
    const critNames = childProfiles.filter((c) => c.stability_level === "critical").map((c) => c.child_name).join(", ");
    insights.push({
      severity: "critical",
      text: `${critical} child(ren) at critical stability level (${critNames}). Immediate placement review required. Consider multi-agency strategy meeting and whether current placement remains in child's best interest.`,
    });
  }

  if (atRisk > 0) {
    const riskNames = childProfiles.filter((c) => c.stability_level === "at_risk").map((c) => c.child_name).join(", ");
    insights.push({
      severity: "warning",
      text: `${atRisk} child(ren) at risk of placement disruption (${riskNames}). Increase keywork frequency, review BSPs, and discuss at next team meeting.`,
    });
  }

  // Overall home stability
  if (avgStabilityScore >= 70 && critical === 0 && atRisk === 0) {
    insights.push({
      severity: "positive",
      text: `Home stability score ${avgStabilityScore}/100. All placements rated good or excellent. ${avgMoodHome ? `Average mood ${avgMoodHome}/10.` : ""} Reg 5 outcomes well evidenced.`,
    });
  }

  // Mood-related insight
  const decliningChildren = childProfiles.filter((c) => c.mood_trend === "declining");
  if (decliningChildren.length > 0) {
    insights.push({
      severity: "warning",
      text: `${decliningChildren.map((c) => c.child_name).join(", ")} showing declining mood trend. Explore contributing factors — consider whether current care approach needs adjustment.`,
    });
  }

  // Keywork engagement
  const noKeywork = childProfiles.filter((c) => c.keywork_count_30d === 0 && c.placement_days > 14);
  if (noKeywork.length > 0) {
    insights.push({
      severity: "warning",
      text: `${noKeywork.map((c) => c.child_name).join(", ")} — no keywork sessions recorded in 30 days. Regular key worker engagement is essential for relationship-based practice and placement stability.`,
    });
  }

  // Positive progress
  const improvingChildren = childProfiles.filter((c) => c.mood_trend === "improving" && c.incident_count_30d === 0);
  if (improvingChildren.length > 0) {
    insights.push({
      severity: "positive",
      text: `${improvingChildren.map((c) => c.child_name).join(", ")} showing improving mood with zero incidents. Placement stability strong — continue current approach and document what's working.`,
    });
  }

  // Incident-free home
  if (totalIncidents30d === 0 && childProfiles.length > 0) {
    insights.push({
      severity: "positive",
      text: "Zero incidents across all placements in past 30 days. Excellent evidence of effective behaviour support and settled home environment.",
    });
  }

  // Ensure at least one insight
  if (insights.length === 0) {
    insights.push({
      severity: "positive",
      text: `${currentChildren.length} current placement(s). Average stability score ${avgStabilityScore}/100. Continue monitoring and recording daily observations to build intelligence.`,
    });
  }

  return {
    children: childProfiles,
    home_metrics: homeMetrics,
    wellbeing_trend: wellbeingTrend,
    disruption_indicators: disruptionIndicators,
    insights,
  };
}
