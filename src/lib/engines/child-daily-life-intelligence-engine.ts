// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILD DAILY LIFE INTELLIGENCE ENGINE
// Per-child engine analysing daily log entries: mood patterns, recording
// frequency, entry type coverage, significant events, and whether the
// child's daily experience is being comprehensively documented.
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
// Injectable `today` parameter for deterministic testing.
//
// Regulatory: CHR 2015 Reg 10 (daily life), Reg 6 (quality of care),
// Reg 36 (records). SCCIF: "Quality of care."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export type DailyEntryType =
  | "general" | "behaviour" | "health" | "education"
  | "contact" | "activity" | "mood" | "sleep" | "food";

export interface DailyLogEntryInput {
  id: string;
  date: string;
  time: string;
  entry_type: DailyEntryType;
  mood_score: number | null;      // 1-10
  is_significant: boolean;
  has_linked_incident: boolean;
  staff_id: string;
}

export interface ChildDailyLifeInput {
  today: string;
  child_id: string;
  child_name: string;
  entries: DailyLogEntryInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type DailyLifeRating = "outstanding" | "good" | "adequate" | "inadequate" | "no_entries";

export interface MoodProfile {
  avg_mood_30d: number | null;
  avg_mood_7d: number | null;
  mood_trend: "improving" | "stable" | "declining" | "insufficient_data";
  lowest_mood_7d: number | null;
  highest_mood_7d: number | null;
  entries_with_mood: number;
  mood_below_5_count: number;     // concerning mood entries
}

export interface RecordingFrequency {
  total_entries: number;
  entries_7d: number;
  entries_30d: number;
  days_with_entries_30d: number;  // out of ~30
  avg_entries_per_day_30d: number | null;
  recording_coverage_rate: number | null; // % of days with at least 1 entry
  trend: "increasing" | "stable" | "decreasing" | "insufficient_data";
}

export interface EntryTypeBreakdown {
  type: DailyEntryType;
  count: number;
  percentage: number;
}

export interface DailyLifeQuality {
  type_variety: number;           // unique entry types
  significant_events_30d: number;
  linked_incidents_30d: number;
  staff_recording_count: number;  // unique staff who recorded
  morning_entries: number;        // entries before 12:00
  afternoon_entries: number;      // entries 12:00-18:00
  evening_entries: number;        // entries after 18:00
}

export interface DailyLifeRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  domain: string;
  regulatory_ref: string;
}

export interface DailyLifeInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface ChildDailyLifeResult {
  generated_at: string;
  child_id: string;
  child_name: string;
  daily_life_rating: DailyLifeRating;
  daily_life_score: number | null;        // 0-100
  headline: string;
  mood_profile: MoodProfile;
  recording_frequency: RecordingFrequency;
  entry_types: EntryTypeBreakdown[];
  quality: DailyLifeQuality;
  strengths: string[];
  concerns: string[];
  recommendations: DailyLifeRecommendation[];
  insights: DailyLifeInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function daysAgo(today: string, date: string): number | null {
  return Math.round(
    (new Date(today).getTime() - new Date(date).getTime()) / 86_400_000,
  );
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function pct(n: number, d: number): number {
  return d > 0  ? Math.round((n / d) * 100)  : null;
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

function getHour(time: string): number {
  const parts = time.split(":");
  return parseInt(parts[0] ?? "12", 10);
}

// ── Main Computation ────────────────────────────────────────────────────────

export function computeChildDailyLife(
  input: ChildDailyLifeInput,
): ChildDailyLifeResult {
  const { today, child_id, child_name, entries } = input;

  // Sort by date+time descending
  const sorted = [...entries].sort((a, b) => {
    const dCmp = b.date.localeCompare(a.date);
    if (dCmp !== 0) return dCmp;
    return b.time.localeCompare(a.time);
  });

  const entries7d = sorted.filter((e) => {
    const da = daysAgo(today, e.date);
    return (da ?? 0) >= 0 && (da ?? 0) <= 7;
  });
  const entries30d = sorted.filter((e) => {
    const da = daysAgo(today, e.date);
    return (da ?? 0) >= 0 && (da ?? 0) <= 30;
  });

  // ── Mood Profile ──────────────────────────────────────────────────────
  const moods30d = entries30d.filter((e) => e.mood_score !== null).map((e) => e.mood_score!);
  const moods7d = entries7d.filter((e) => e.mood_score !== null).map((e) => e.mood_score!);

  // Mood trend: compare 7d avg vs 8-30d avg
  let moodTrend: "improving" | "stable" | "declining" | "insufficient_data" = "insufficient_data";
  if (moods7d.length >= 2 && moods30d.length >= 4) {
    const older = entries30d
      .filter((e) => daysAgo(today, e.date) > 7 && e.mood_score !== null)
      .map((e) => e.mood_score!);
    if (older.length >= 2) {
      const recent = avg(moods7d);
      const olderAvg = avg(older);
      if (recent - olderAvg > 0.5) moodTrend = "improving";
      else if (olderAvg - recent > 0.5) moodTrend = "declining";
      else moodTrend = "stable";
    }
  }

  const mood_profile: MoodProfile = {
    avg_mood_30d: moods30d.length > 0 ? avg(moods30d) : null,
    avg_mood_7d: moods7d.length > 0 ? avg(moods7d) : null,
    mood_trend: moodTrend,
    lowest_mood_7d: moods7d.length > 0 ? Math.min(...moods7d) : null,
    highest_mood_7d: moods7d.length > 0 ? Math.max(...moods7d) : null,
    entries_with_mood: moods30d.length,
    mood_below_5_count: moods30d.filter((m) => m < 5).length,
  };

  // ── Recording Frequency ───────────────────────────────────────────────
  const uniqueDays30d = new Set(entries30d.map((e) => e.date));
  const coverageRate = pct(uniqueDays30d.size, 30);
  const avgPerDay = entries30d.length > 0 ? Math.round((entries30d.length / Math.max(uniqueDays30d.size, 1)) * 10) / 10 : null;

  // Trend: compare entries in first 15d vs last 15d of 30d window
  let recTrend: "increasing" | "stable" | "decreasing" | "insufficient_data" = "insufficient_data";
  if (entries30d.length >= 6) {
    const first15 = entries30d.filter((e) => daysAgo(today, e.date) <= 15);
    const last15 = entries30d.filter((e) => daysAgo(today, e.date) > 15 && daysAgo(today, e.date) <= 30);
    if (first15.length > last15.length + 2) recTrend = "increasing";
    else if (last15.length > first15.length + 2) recTrend = "decreasing";
    else recTrend = "stable";
  }

  const recording_frequency: RecordingFrequency = {
    total_entries: entries.length,
    entries_7d: entries7d.length,
    entries_30d: entries30d.length,
    days_with_entries_30d: uniqueDays30d.size,
    avg_entries_per_day_30d: avgPerDay,
    recording_coverage_rate: coverageRate,
    trend: recTrend,
  };

  // ── Entry Type Breakdown ──────────────────────────────────────────────
  const typeCounts = new Map<DailyEntryType, number>();
  for (const e of entries30d) {
    typeCounts.set(e.entry_type, (typeCounts.get(e.entry_type) ?? 0) + 1);
  }
  const entry_types: EntryTypeBreakdown[] = [...typeCounts.entries()]
    .map(([type, count]) => ({ type, count, percentage: pct(count, entries30d.length) }))
    .sort((a, b) => b.count - a.count);

  // ── Quality ───────────────────────────────────────────────────────────
  const significantEvents30d = entries30d.filter((e) => e.is_significant);
  const linkedIncidents30d = entries30d.filter((e) => e.has_linked_incident);
  const uniqueStaff30d = new Set(entries30d.map((e) => e.staff_id));

  const morningEntries = entries30d.filter((e) => getHour(e.time) < 12);
  const afternoonEntries = entries30d.filter((e) => getHour(e.time) >= 12 && getHour(e.time) < 18);
  const eveningEntries = entries30d.filter((e) => getHour(e.time) >= 18);

  const quality: DailyLifeQuality = {
    type_variety: typeCounts.size,
    significant_events_30d: significantEvents30d.length,
    linked_incidents_30d: linkedIncidents30d.length,
    staff_recording_count: uniqueStaff30d.size,
    morning_entries: morningEntries.length,
    afternoon_entries: afternoonEntries.length,
    evening_entries: eveningEntries.length,
  };

  // ── Score ─────────────────────────────────────────────────────────────
  let score = 50;

  if (entries.length === 0) {
    score = 0;
  } else {
    // Recording coverage
    if (coverageRate >= 90) score += 15;
    else if (coverageRate >= 70) score += 8;
    else if (coverageRate < 50) score -= 15;
    else if (coverageRate < 70) score -= 5;

    // Entry frequency
    if ((avgPerDay ?? 0) >= 3) score += 5;
    else if ((avgPerDay ?? 0) >= 2) score += 2;

    // Mood recording
    const moodRate = pct(moods30d.length, entries30d.length);
    if (moodRate >= 80) score += 5;
    else if (moodRate < 30) score -= 5;

    // Type variety
    if (typeCounts.size >= 6) score += 10;
    else if (typeCounts.size >= 4) score += 5;
    else if (typeCounts.size < 3 && entries30d.length >= 5) score -= 5;

    // Multiple staff recording
    if (uniqueStaff30d.size >= 3) score += 3;

    // Time of day coverage (entries across morning/afternoon/evening)
    const timeSegments = [morningEntries.length > 0, afternoonEntries.length > 0, eveningEntries.length > 0].filter(Boolean).length;
    if (timeSegments === 3) score += 5;
    else if (timeSegments < 2) score -= 3;

    // Mood concerns
    if (mood_profile.mood_below_5_count > 5) score -= 3;
    if (moodTrend === "declining") score -= 5;
    if (moodTrend === "improving") score += 3;

    // No entries in last 7 days
    if (entries7d.length === 0 && entries.length > 0) score -= 10;
  }

  score = clamp(score, 0, 100);

  const daily_life_rating: DailyLifeRating =
    entries.length === 0 ? "no_entries" :
    score >= 80 ? "outstanding" :
    score >= 65 ? "good" :
    score >= 45 ? "adequate" :
    "inadequate";

  // ── Headline ──────────────────────────────────────────────────────────
  const parts: string[] = [];
  parts.push(`Daily recording: ${daily_life_rating}`);
  if (entries.length > 0) {
    parts.push(`${entries30d.length} entries (30d)`);
    parts.push(`${coverageRate}% coverage`);
  }
  if (mood_profile.avg_mood_7d !== null) parts.push(`avg mood ${mood_profile.avg_mood_7d}/10`);
  if (moodTrend === "declining") parts.push("mood declining");
  if (entries7d.length === 0 && entries.length > 0) parts.push("no entries this week");
  const headline = parts.join(". ") + ".";

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];

  if (daily_life_rating === "outstanding" || daily_life_rating === "good") {
    strengths.push(`Daily recording rated ${daily_life_rating} (${score}%). ${child_name}'s daily life is comprehensively documented with good coverage, mood tracking, and varied entry types.`);
  }

  if (coverageRate >= 90) {
    strengths.push(`${coverageRate}% recording coverage over 30 days. Almost every day is documented, creating a rich, continuous picture of ${child_name}'s daily experience — exactly what inspectors want to see.`);
  }

  if (mood_profile.avg_mood_7d !== null && mood_profile.avg_mood_7d >= 7) {
    strengths.push(`Average mood ${mood_profile.avg_mood_7d}/10 over the last 7 days. ${child_name} is generally in good spirits, suggesting the placement is meeting their emotional needs.`);
  }

  if (typeCounts.size >= 6) {
    strengths.push(`${typeCounts.size} different entry types recorded — covering health, education, mood, behaviour, activities, and more. This holistic recording creates a complete picture of the child's daily life.`);
  }

  if (uniqueStaff30d.size >= 3) {
    strengths.push(`${uniqueStaff30d.size} different staff members contributing to daily records. Multiple perspectives ensure a balanced, comprehensive view of ${child_name}'s daily experience.`);
  }

  if (moodTrend === "improving") {
    strengths.push("Mood trend is improving. This upward trajectory suggests that current care, interventions, and support are having a positive impact on the child's emotional wellbeing.");
  }

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];

  if (entries.length === 0) {
    concerns.push(`No daily log entries recorded for ${child_name}. Daily recording is a fundamental requirement — it evidences care, tracks wellbeing, and provides a contemporaneous account of the child's experience. This is a serious gap.`);
  }

  if (coverageRate < 50 && entries.length > 0) {
    concerns.push(`Only ${coverageRate}% recording coverage (${uniqueDays30d.size} out of 30 days). Gaps in recording mean gaps in oversight — significant events or changes in wellbeing could go unnoticed and undocumented.`);
  }

  if (entries7d.length === 0 && entries.length > 0) {
    concerns.push(`No daily log entries in the last 7 days. This means an entire week of ${child_name}'s daily life is undocumented — this would be a significant finding at inspection.`);
  }

  if (moodTrend === "declining") {
    concerns.push(`${child_name}'s mood is declining. This pattern needs attention — explore what might be causing the drop and whether additional support, therapeutic input, or changes to care are needed.`);
  }

  if (mood_profile.mood_below_5_count >= 3) {
    concerns.push(`${mood_profile.mood_below_5_count} entries with mood below 5/10 in the last 30 days. Multiple low-mood entries suggest ${child_name} is regularly unhappy — this should trigger a review of what's causing distress.`);
  }

  if (typeCounts.size < 3 && entries30d.length >= 5) {
    concerns.push(`Only ${typeCounts.size} entry type${typeCounts.size !== 1 ? "s" : ""} used. Limited variety suggests recording may be formulaic. Ensure entries cover health, education, activities, mood, and behaviour for a complete picture.`);
  }

  // ── Recommendations ───────────────────────────────────────────────────
  const recommendations: DailyLifeRecommendation[] = [];
  let rank = 0;

  if (entries.length === 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Begin daily recording for ${child_name} immediately. Every shift should include at least one entry covering what happened, how the child presented, and their mood.`,
      urgency: "immediate",
      domain: "recording",
      regulatory_ref: "Reg 36",
    });
  }

  if (entries7d.length === 0 && entries.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Resume daily recording this shift. Address the recording gap with the team and ensure all staff understand the importance of contemporaneous recording.",
      urgency: "immediate",
      domain: "recording",
      regulatory_ref: "Reg 36",
    });
  }

  if (moodTrend === "declining") {
    recommendations.push({
      rank: ++rank,
      recommendation: `Investigate the declining mood pattern with ${child_name}. Use keywork sessions to explore what's causing the dip and whether additional support (CAMHS, contact changes, routine adjustments) is needed.`,
      urgency: "soon",
      domain: "wellbeing",
      regulatory_ref: "Reg 6",
    });
  }

  if (coverageRate < 70 && entries.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Improve recording coverage from ${coverageRate}% to at least 90%. Add daily recording to the handover checklist and ensure every shift contributes at least one entry.`,
      urgency: "soon",
      domain: "recording",
      regulatory_ref: "Reg 36",
    });
  }

  if (typeCounts.size < 4 && entries30d.length >= 3) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Diversify entry types. Ensure entries cover health, education, activities, mood, and behaviour — not just general observations. This creates a more complete picture for care planning and inspection evidence.`,
      urgency: "planned",
      domain: "quality",
      regulatory_ref: "Reg 10",
    });
  }

  // ── Cara Insights ─────────────────────────────────────────────────────
  const insights: DailyLifeInsight[] = [];

  if (daily_life_rating === "inadequate") {
    insights.push({
      severity: "critical",
      text: `Daily recording is inadequate (${score}%). Ofsted expects to see a contemporaneous, comprehensive account of each child's daily life. Gaps in recording are gaps in oversight — they leave the home unable to evidence the quality of care provided.`,
    });
  }

  if (entries.length === 0) {
    insights.push({
      severity: "critical",
      text: `No daily records. Without a daily log, there is no contemporaneous evidence of ${child_name}'s experience in care. This is a fundamental regulatory requirement — CHR 2015 Reg 36 requires records of daily life to be maintained.`,
    });
  }

  if (daily_life_rating === "outstanding") {
    insights.push({
      severity: "positive",
      text: `Daily recording is outstanding (${score}%). Comprehensive coverage, varied entry types, and consistent mood tracking create a rich, evidenced picture of ${child_name}'s daily experience. This level of recording directly supports care planning and would impress inspectors.`,
    });
  }

  if (coverageRate >= 90 && typeCounts.size >= 5 && mood_profile.avg_mood_7d !== null && mood_profile.avg_mood_7d >= 6) {
    insights.push({
      severity: "positive",
      text: `Excellent recording quality with ${coverageRate}% coverage and ${typeCounts.size} entry types. Combined with a positive mood average (${mood_profile.avg_mood_7d}/10), this evidences both good care and good recording practice — the gold standard for residential care.`,
    });
  }

  return {
    generated_at: today,
    child_id,
    child_name,
    daily_life_rating,
    daily_life_score: score,
    headline,
    mood_profile,
    recording_frequency,
    entry_types,
    quality,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
