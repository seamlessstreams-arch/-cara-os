// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CHILD PLACEMENT QUALITY INTELLIGENCE ENGINE
// Per-child engine measuring the quality of the child's placement experience:
// placement duration/stability, mood trajectory, daily log engagement,
// key worker relationship, welfare checks, activities, and whether the
// child feels settled and is making progress.
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
// Injectable `today` parameter for deterministic testing.
//
// Regulatory: CHR 2015 Reg 5 (engagement), Reg 6 (quality of care),
// Reg 7 (welfare), Reg 9 (accommodation). SCCIF: "Experiences and progress."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface DailyLogInput {
  id: string;
  date: string;
  entry_type: string;
  mood_score: number | null;        // 1-10
  is_significant: boolean;
  staff_id: string;
}

export interface KeyWorkInput {
  id: string;
  date: string;
  child_engaged: boolean;
  mood_before: number;              // 1-5
  mood_after: number;               // 1-5
  themes: string[];
}

export interface WelfareCheckInput {
  id: string;
  date: string;
  outcome: string;                  // ok, concern, not_checked
}

export interface ActivityInput {
  id: string;
  date: string;
  type: string;
  child_participated: boolean;
}

export interface PlacementMoveInput {
  id: string;
  date: string;
  reason: string;
  planned: boolean;
}

export interface ChildPlacementQualityInput {
  today: string;
  child_id: string;
  child_name: string;
  child_age: number;
  placement_start: string;
  key_worker_name: string;
  daily_logs: DailyLogInput[];
  key_work_sessions: KeyWorkInput[];
  welfare_checks: WelfareCheckInput[];
  activities: ActivityInput[];
  placement_moves: PlacementMoveInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type PlacementQuality = "outstanding" | "good" | "adequate" | "concerning" | "poor" | "insufficient_data";

export interface MoodTrajectory {
  average_30d: number;
  average_previous_30d: number;
  trend: "improving" | "stable" | "declining" | "insufficient_data";
  highest_day: { date: string; score: number } | null;
  lowest_day: { date: string; score: number } | null;
}

export interface EngagementProfile {
  daily_log_count_30d: number;
  significant_entries_30d: number;
  staff_variety_30d: number;         // unique staff recording
  entry_type_spread: { type: string; count: number }[];
}

export interface KeyWorkProfile {
  sessions_30d: number;
  engagement_rate: number;
  mood_improvement_rate: number;     // % where mood_after > mood_before
  top_themes: { theme: string; count: number }[];
}

export interface WelfareProfile {
  checks_30d: number;
  ok_rate: number;
  concern_count: number;
}

export interface ActivityProfile {
  activities_30d: number;
  participation_rate: number;
  types: { type: string; count: number }[];
}

export interface StabilityProfile {
  days_in_placement: number;
  total_moves: number;
  unplanned_moves: number;
  is_long_term: boolean;             // > 180 days
}

export interface PlacementRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  domain: string;
  regulatory_ref: string;
}

export interface PlacementInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface ChildPlacementQualityResult {
  generated_at: string;
  child_id: string;
  child_name: string;
  placement_quality: PlacementQuality;
  quality_score: number;              // 0-100
  headline: string;
  mood_trajectory: MoodTrajectory;
  engagement: EngagementProfile;
  key_work: KeyWorkProfile;
  welfare: WelfareProfile;
  activities: ActivityProfile;
  stability: StabilityProfile;
  strengths: string[];
  concerns: string[];
  recommendations: PlacementRecommendation[];
  insights: PlacementInsight[];
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

function pct(n: number, d: number): number {
  return d > 0 ? Math.round((n / d) * 100) : 100;
}

function avg(values: number[]): number {
  return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

// ── Main Computation ────────────────────────────────────────────────────────

export function computeChildPlacementQuality(
  input: ChildPlacementQualityInput,
): ChildPlacementQualityResult {
  const { today, child_id, child_name, child_age, placement_start, key_worker_name, daily_logs, key_work_sessions, welfare_checks, activities, placement_moves } = input;

  // ── Placement Stability ──────────────────────────────────────────────
  const daysInPlacement = Math.max(0, daysAgo(today, placement_start));
  const unplannedMoves = placement_moves.filter((m) => !m.planned);

  const stability: StabilityProfile = {
    days_in_placement: daysInPlacement,
    total_moves: placement_moves.length,
    unplanned_moves: unplannedMoves.length,
    is_long_term: daysInPlacement > 180,
  };

  // ── Mood Trajectory ──────────────────────────────────────────────────
  const logsWithMood30d = daily_logs.filter((l) => isWithin(today, l.date, 30) && l.mood_score !== null);
  const logsWithMoodPrev = daily_logs.filter((l) => {
    const da = daysAgo(today, l.date);
    return da > 30 && da <= 60 && l.mood_score !== null;
  });

  const moods30d = logsWithMood30d.map((l) => l.mood_score!);
  const moodsPrev = logsWithMoodPrev.map((l) => l.mood_score!);
  const avg30d = Math.round(avg(moods30d) * 10) / 10;
  const avgPrev = Math.round(avg(moodsPrev) * 10) / 10;

  let moodTrend: MoodTrajectory["trend"];
  if (moods30d.length < 2 && moodsPrev.length < 2) {
    moodTrend = "insufficient_data";
  } else if (moods30d.length === 0 && moodsPrev.length > 0) {
    moodTrend = "declining"; // No recent mood = concern
  } else if (moodsPrev.length === 0 && moods30d.length > 0) {
    moodTrend = "improving"; // First moods = improving from baseline
  } else if (avg30d > avgPrev + 0.5) {
    moodTrend = "improving";
  } else if (avg30d < avgPrev - 0.5) {
    moodTrend = "declining";
  } else {
    moodTrend = "stable";
  }

  let highest: MoodTrajectory["highest_day"] = null;
  let lowest: MoodTrajectory["lowest_day"] = null;
  if (logsWithMood30d.length > 0) {
    const sorted = [...logsWithMood30d].sort((a, b) => b.mood_score! - a.mood_score!);
    highest = { date: sorted[0].date, score: sorted[0].mood_score! };
    lowest = { date: sorted[sorted.length - 1].date, score: sorted[sorted.length - 1].mood_score! };
  }

  const mood_trajectory: MoodTrajectory = {
    average_30d: avg30d,
    average_previous_30d: avgPrev,
    trend: moodTrend,
    highest_day: highest,
    lowest_day: lowest,
  };

  // ── Engagement Profile ───────────────────────────────────────────────
  const logs30d = daily_logs.filter((l) => isWithin(today, l.date, 30));
  const significantLogs = logs30d.filter((l) => l.is_significant);
  const uniqueStaff = new Set(logs30d.map((l) => l.staff_id)).size;

  const typeCounts: Record<string, number> = {};
  logs30d.forEach((l) => {
    typeCounts[l.entry_type] = (typeCounts[l.entry_type] ?? 0) + 1;
  });
  const typeSpread = Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({ type, count }));

  const engagement: EngagementProfile = {
    daily_log_count_30d: logs30d.length,
    significant_entries_30d: significantLogs.length,
    staff_variety_30d: uniqueStaff,
    entry_type_spread: typeSpread,
  };

  // ── Key Work Profile ─────────────────────────────────────────────────
  const kw30d = key_work_sessions.filter((k) => isWithin(today, k.date, 30));
  const kwEngaged = kw30d.filter((k) => k.child_engaged);
  const kwMoodImproved = kw30d.filter((k) => k.mood_after > k.mood_before);

  const themeCounts: Record<string, number> = {};
  kw30d.forEach((k) =>
    k.themes.forEach((t) => {
      themeCounts[t] = (themeCounts[t] ?? 0) + 1;
    }),
  );
  const topThemes = Object.entries(themeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([theme, count]) => ({ theme, count }));

  const key_work: KeyWorkProfile = {
    sessions_30d: kw30d.length,
    engagement_rate: pct(kwEngaged.length, kw30d.length),
    mood_improvement_rate: pct(kwMoodImproved.length, kw30d.length),
    top_themes: topThemes,
  };

  // ── Welfare Profile ──────────────────────────────────────────────────
  const welf30d = welfare_checks.filter((w) => isWithin(today, w.date, 30));
  const okChecks = welf30d.filter((w) => w.outcome === "ok");
  const concernChecks = welf30d.filter((w) => w.outcome === "concern");

  const welfare: WelfareProfile = {
    checks_30d: welf30d.length,
    ok_rate: pct(okChecks.length, welf30d.length),
    concern_count: concernChecks.length,
  };

  // ── Activity Profile ─────────────────────────────────────────────────
  const act30d = activities.filter((a) => isWithin(today, a.date, 30));
  const participated = act30d.filter((a) => a.child_participated);

  const actTypeCounts: Record<string, number> = {};
  act30d.forEach((a) => {
    actTypeCounts[a.type] = (actTypeCounts[a.type] ?? 0) + 1;
  });
  const actTypes = Object.entries(actTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({ type, count }));

  const activityProfile: ActivityProfile = {
    activities_30d: act30d.length,
    participation_rate: pct(participated.length, act30d.length),
    types: actTypes,
  };

  // ── Composite Quality Score (0-100) ──────────────────────────────────
  let score = 50;

  // Placement stability
  if (daysInPlacement > 180) score += 5;
  else if (daysInPlacement > 90) score += 3;
  if (unplannedMoves.length === 0 && placement_moves.length === 0) score += 3;
  if (unplannedMoves.length > 0) score -= unplannedMoves.length * 5;

  // Mood trajectory
  if (moodTrend === "improving") score += 8;
  else if (moodTrend === "stable" && avg30d >= 6) score += 5;
  else if (moodTrend === "stable" && avg30d >= 4) score += 2;
  else if (moodTrend === "declining") score -= 8;
  if (avg30d >= 7) score += 5;
  else if (avg30d < 4 && moods30d.length > 0) score -= 5;

  // Daily log engagement
  if (logs30d.length >= 20) score += 5;
  else if (logs30d.length >= 10) score += 3;
  else if (logs30d.length < 5 && logs30d.length > 0) score -= 3;
  else if (logs30d.length === 0) score -= 5;
  if (uniqueStaff >= 3) score += 3;
  if (typeSpread.length >= 4) score += 2;

  // Key work
  if (kw30d.length >= 3 && key_work.engagement_rate >= 80) score += 8;
  else if (kw30d.length >= 2) score += 3;
  else if (kw30d.length === 0) score -= 5;
  if (key_work.mood_improvement_rate >= 60 && kw30d.length >= 2) score += 3;

  // Welfare
  if (welfare.ok_rate === 100 && welf30d.length >= 5) score += 3;
  if (welfare.concern_count > 0) score -= welfare.concern_count * 2;

  // Activities
  if (activityProfile.participation_rate >= 80 && act30d.length >= 3) score += 5;
  else if (act30d.length === 0) score -= 3;

  score = clamp(Math.round(score), 0, 100);

  // ── Quality Rating ───────────────────────────────────────────────────
  const hasData = logs30d.length > 0 || kw30d.length > 0 || welf30d.length > 0;

  let placement_quality: PlacementQuality;
  if (!hasData) {
    placement_quality = "insufficient_data";
  } else if (score >= 80) {
    placement_quality = "outstanding";
  } else if (score >= 65) {
    placement_quality = "good";
  } else if (score >= 50) {
    placement_quality = "adequate";
  } else if (score >= 35) {
    placement_quality = "concerning";
  } else {
    placement_quality = "poor";
  }

  // ── Headline ──────────────────────────────────────────────────────────
  const parts: string[] = [];
  parts.push(`${child_name} placement quality: ${placement_quality}`);
  if (daysInPlacement > 0) parts.push(`${daysInPlacement} days in placement`);
  if (avg30d > 0) parts.push(`avg mood ${avg30d}/10`);
  if (moodTrend !== "insufficient_data") parts.push(`mood ${moodTrend}`);
  if (kw30d.length > 0) parts.push(`${kw30d.length} key work sessions`);
  const headline = parts.join(". ") + ".";

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];

  if (daysInPlacement > 180) {
    strengths.push(`${child_name} has been in placement for ${daysInPlacement} days (${Math.round(daysInPlacement / 30)} months). This placement longevity supports relationship-building and emotional security (Reg 9).`);
  }

  if (moodTrend === "improving") {
    strengths.push(`Mood trajectory is improving (${avgPrev}/10 to ${avg30d}/10). ${child_name} appears to be settling and benefiting from the care environment.`);
  }

  if (avg30d >= 7 && moods30d.length >= 3) {
    strengths.push(`Average mood score of ${avg30d}/10 over the past 30 days indicates a positive care experience. ${child_name} appears happy and settled.`);
  }

  if (key_work.engagement_rate >= 80 && kw30d.length >= 3) {
    strengths.push(`${key_work.engagement_rate}% key work engagement across ${kw30d.length} sessions demonstrates a strong working relationship with ${key_worker_name}.`);
  }

  if (key_work.mood_improvement_rate >= 60 && kw30d.length >= 2) {
    strengths.push(`Mood improved in ${key_work.mood_improvement_rate}% of key work sessions. Key work is having a positive therapeutic impact.`);
  }

  if (uniqueStaff >= 3 && logs30d.length >= 10) {
    strengths.push(`${uniqueStaff} different staff have recorded daily logs for ${child_name}. This breadth of recording ensures a complete picture of daily life (Reg 6).`);
  }

  if (activityProfile.participation_rate >= 80 && act30d.length >= 3) {
    strengths.push(`${activityProfile.participation_rate}% activity participation rate across ${act30d.length} activities. ${child_name} is actively engaged in the life of the home.`);
  }

  if (welfare.ok_rate === 100 && welf30d.length >= 10) {
    strengths.push(`100% positive welfare check outcomes across ${welf30d.length} checks. Consistent monitoring confirms ${child_name} is safe and well.`);
  }

  if (unplannedMoves.length === 0 && daysInPlacement > 90) {
    strengths.push("No unplanned placement moves. Placement stability is a key protective factor for looked-after children.");
  }

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];

  if (moodTrend === "declining") {
    concerns.push(`Mood trajectory is declining (${avgPrev}/10 to ${avg30d}/10). ${child_name} may be struggling — explore what has changed and whether additional support is needed.`);
  }

  if (avg30d < 4 && moods30d.length >= 3) {
    concerns.push(`Average mood score of ${avg30d}/10 is low. ${child_name} may not feel settled or happy in placement. Consider a wellbeing conversation and review care approach.`);
  }

  if (kw30d.length === 0) {
    concerns.push(`No key work sessions recorded in 30 days. Every child should have regular 1:1 time with their key worker to feel heard and supported (Reg 5).`);
  }

  if (key_work.engagement_rate < 50 && kw30d.length >= 2) {
    concerns.push(`Key work engagement rate at ${key_work.engagement_rate}%. Low engagement may indicate relationship difficulties or that sessions are not meeting ${child_name}'s needs.`);
  }

  if (logs30d.length < 5) {
    concerns.push(`Only ${logs30d.length} daily log entries in 30 days. Insufficient recording makes it difficult to track progress and identify patterns (Reg 6).`);
  }

  if (welfare.concern_count >= 2) {
    concerns.push(`${welfare.concern_count} welfare check concerns in 30 days. Each concern must be followed up and any emerging patterns addressed promptly.`);
  }

  if (act30d.length === 0) {
    concerns.push("No structured activities recorded in 30 days. Children need enriching experiences and opportunities to develop interests (Reg 7).");
  }

  if (activityProfile.participation_rate < 50 && act30d.length >= 3) {
    concerns.push(`Activity participation rate at ${activityProfile.participation_rate}%. ${child_name} may be withdrawing from communal life — explore reasons sensitively.`);
  }

  if (unplannedMoves.length > 0) {
    concerns.push(`${unplannedMoves.length} unplanned placement move${unplannedMoves.length !== 1 ? "s" : ""}. Placement disruption has a significant negative impact on children in care.`);
  }

  if (lowest && lowest.score <= 2 && moods30d.length >= 3) {
    concerns.push(`${child_name} recorded a very low mood score (${lowest.score}/10) on ${lowest.date}. Investigate what happened on this day and whether follow-up support was provided.`);
  }

  // ── Recommendations ───────────────────────────────────────────────────
  const recommendations: PlacementRecommendation[] = [];
  let rank = 0;

  if (moodTrend === "declining" && avg30d < 5) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Arrange an urgent wellbeing conversation with ${child_name}. Explore what has changed and whether the care environment is meeting their needs. Consider CAMHS referral if mood continues to decline.`,
      urgency: "immediate",
      domain: "wellbeing",
      regulatory_ref: "Reg 7",
    });
  }

  if (kw30d.length === 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Schedule weekly key work sessions with ${key_worker_name}. Regular 1:1 time is essential for building trust, capturing the child's voice, and monitoring wellbeing.`,
      urgency: "soon",
      domain: "key_work",
      regulatory_ref: "Reg 5",
    });
  }

  if (logs30d.length < 5) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Improve daily log recording. All staff should contribute to a holistic picture of the child's day — mood, activities, interactions, and any concerns.",
      urgency: "soon",
      domain: "recording",
      regulatory_ref: "Reg 6",
    });
  }

  if (act30d.length === 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Plan structured activities tailored to ${child_name}'s interests. Activities promote social skills, self-esteem, and a sense of belonging in the home.`,
      urgency: "planned",
      domain: "activities",
      regulatory_ref: "Reg 7",
    });
  }

  if (welfare.concern_count >= 2) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Review welfare check concerns for patterns. Are concerns happening at specific times? With specific staff? Addressing patterns proactively improves outcomes.",
      urgency: "soon",
      domain: "welfare",
      regulatory_ref: "Reg 7",
    });
  }

  if (key_work.engagement_rate < 50 && kw30d.length >= 2) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Review key work approach with ${child_name}. Consider changing timing, location, or format. Ask what they would prefer — some children engage better during activities rather than formal sessions.`,
      urgency: "planned",
      domain: "key_work",
      regulatory_ref: "Reg 5",
    });
  }

  // ── ARIA Insights ─────────────────────────────────────────────────────
  const insights: PlacementInsight[] = [];

  if (placement_quality === "poor" || placement_quality === "concerning") {
    insights.push({
      severity: "critical",
      text: `${child_name}'s placement quality is ${placement_quality} (score: ${score}%). Multiple indicators suggest this child may not be experiencing good enough care. Ofsted inspectors would expect to see evidence of improvement actions and impact. A placement review may be needed.`,
    });
  }

  if (moodTrend === "declining" && avg30d < 4) {
    insights.push({
      severity: "critical",
      text: `${child_name}'s mood is declining and the average is low (${avg30d}/10). This combination is a significant concern — the child may be experiencing distress that is not being adequately addressed. Immediate wellbeing assessment recommended.`,
    });
  }

  if (placement_quality === "outstanding") {
    insights.push({
      severity: "positive",
      text: `${child_name}'s placement quality is outstanding (score: ${score}%). The child appears settled, engaged, and is making progress. Strong key work, positive mood, and active participation evidence high-quality care that inspectors would view very favourably.`,
    });
  }

  if (moodTrend === "improving" && key_work.engagement_rate >= 80 && kw30d.length >= 3) {
    insights.push({
      severity: "positive",
      text: `Mood is improving alongside high key work engagement. This correlation suggests the key working relationship is having a direct positive impact on ${child_name}'s wellbeing — exactly the kind of evidence Ofsted looks for.`,
    });
  }

  if (stability.is_long_term && unplannedMoves.length === 0 && avg30d >= 6) {
    insights.push({
      severity: "positive",
      text: `${child_name} has been in a stable placement for ${Math.round(daysInPlacement / 30)} months with positive mood and no disruptions. Placement stability is one of the strongest protective factors for looked-after children.`,
    });
  }

  if (uniqueStaff >= 3 && logs30d.length >= 15 && typeSpread.length >= 4) {
    insights.push({
      severity: "positive",
      text: "Comprehensive multi-source recording with diverse entry types from multiple staff. This evidences a team-around-the-child approach where all staff contribute to understanding and supporting this young person.",
    });
  }

  return {
    generated_at: today,
    child_id,
    child_name,
    placement_quality,
    quality_score: score,
    headline,
    mood_trajectory,
    engagement,
    key_work,
    welfare,
    activities: activityProfile,
    stability,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
