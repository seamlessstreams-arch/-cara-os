// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME DAILY LOG INTELLIGENCE ENGINE
// Home-level: aggregates daily recording patterns, mood tracking, entry types,
// staff participation, and significant event flagging.
// CHR 2015 Reg 36: "Records — maintain comprehensive records."
// SCCIF: "Records are clear, up to date, and stored safely."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input types ─────────────────────────────────────────────────────────────

export const ALL_ENTRY_TYPES = [
  "general", "behaviour", "health", "education", "contact",
  "activity", "mood", "sleep", "food",
] as const;

export interface DailyLogEntryInput {
  id: string;
  child_id: string;
  date: string;                       // ISO date
  time: string;
  entry_type: string;                 // general | behaviour | health | education | ...
  content: string;
  mood_score: number | null;          // 1-10
  staff_id: string;
  linked_incident_id: string | null;
  is_significant: boolean;
}

export interface HomeDailyLogInput {
  today: string;
  daily_logs: DailyLogEntryInput[];
  total_children: number;
  total_staff: number;
}

// ── Output types ────────────────────────────────────────────────────────────

export type DailyLogRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface RecordingFrequencyProfile {
  total_entries_14d: number;
  entries_per_day_avg: number;
  entries_per_child_per_day_avg: number;
  days_with_entries_14d: number;
  days_with_no_entries: number;
}

export interface EntryTypeProfile {
  by_type: Record<string, number>;
  types_used: string[];
  types_missing: string[];
  type_diversity_rate: number;        // types used / total types
}

export interface MoodTrackingProfile {
  entries_with_mood: number;
  mood_tracking_rate: number;
  avg_mood_score: number;
  low_mood_count: number;             // mood_score <= 4
  high_mood_count: number;            // mood_score >= 8
}

export interface StaffParticipationProfile {
  unique_staff_14d: number;
  staff_participation_rate: number;   // staff who logged / total_staff
  most_active_staff_entries: number;
  least_active_staff_entries: number;
}

export interface ChildCoverageProfile {
  children_with_entries_14d: number;
  children_without: number;
  child_coverage_rate: number;
  entries_per_child: Record<string, number>;
}

export interface ContentQualityProfile {
  significant_entries: number;
  significant_rate: number;
  avg_content_length: number;
  incident_linked_count: number;
}

export interface HomeDailyLogResult {
  log_rating: DailyLogRating;
  log_score: number;
  headline: string;
  frequency: RecordingFrequencyProfile;
  entry_types: EntryTypeProfile;
  mood: MoodTrackingProfile;
  staff: StaffParticipationProfile;
  child_coverage: ChildCoverageProfile;
  quality: ContentQualityProfile;
  strengths: string[];
  concerns: string[];
  recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[];
  insights: { text: string; severity: string }[];
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

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeHomeDailyLog(
  input: HomeDailyLogInput,
): HomeDailyLogResult {
  const { today, daily_logs, total_children, total_staff } = input;

  // ── Insufficient data guard ───────────────────────────────────────────
  if ((total_children === 0 && total_staff === 0) || daily_logs.length === 0) {
    return {
      log_rating: "insufficient_data",
      log_score: 0,
      headline: "No daily log data available for analysis.",
      frequency: { total_entries_14d: 0, entries_per_day_avg: 0, entries_per_child_per_day_avg: 0, days_with_entries_14d: 0, days_with_no_entries: 14 },
      entry_types: { by_type: {}, types_used: [], types_missing: [...ALL_ENTRY_TYPES], type_diversity_rate: 0 },
      mood: { entries_with_mood: 0, mood_tracking_rate: 0, avg_mood_score: 0, low_mood_count: 0, high_mood_count: 0 },
      staff: { unique_staff_14d: 0, staff_participation_rate: 0, most_active_staff_entries: 0, least_active_staff_entries: 0 },
      child_coverage: { children_with_entries_14d: 0, children_without: total_children, child_coverage_rate: 0, entries_per_child: {} },
      quality: { significant_entries: 0, significant_rate: 0, avg_content_length: 0, incident_linked_count: 0 },
      strengths: [],
      concerns: ["No daily log entries recorded — recording practice cannot be assessed."],
      recommendations: [],
      insights: [],
    };
  }

  // ── Filter to last 14 days ────────────────────────────────────────────
  // A true 14-day window: today and the 13 preceding days (d = 0..13). The window
  // size MUST match the divisor used for no-entry/frequency counts. Previously the
  // filter admitted d <= 14 (15 distinct days) while dividing by 14, so a
  // fully-recorded home produced a NEGATIVE days_with_no_entries and the
  // recording-gap / safeguarding alerts (>=5, >=3, >=7 no-entry days) fired one
  // day late.
  const WINDOW_DAYS = 14;
  const logs14d = daily_logs.filter(l => {
    const d = daysBetween(l.date, today);
    return d >= 0 && d < WINDOW_DAYS;
  });

  // ── Recording Frequency ───────────────────────────────────────────────
  const daysSet = new Set(logs14d.map(l => l.date));
  const daysWithEntries = daysSet.size;
  const daysWithNoEntries = Math.max(0, WINDOW_DAYS - daysWithEntries);
  const entriesPerDay = logs14d.length > 0 ? Math.round((logs14d.length / Math.max(daysWithEntries, 1)) * 10) / 10 : 0;
  const entriesPerChildPerDay = total_children > 0 && daysWithEntries > 0
    ? Math.round((logs14d.length / (total_children * daysWithEntries)) * 10) / 10
    : 0;

  const frequency: RecordingFrequencyProfile = {
    total_entries_14d: logs14d.length,
    entries_per_day_avg: entriesPerDay,
    entries_per_child_per_day_avg: entriesPerChildPerDay,
    days_with_entries_14d: daysWithEntries,
    days_with_no_entries: daysWithNoEntries,
  };

  // ── Entry Type Distribution ───────────────────────────────────────────
  const byType: Record<string, number> = {};
  for (const l of logs14d) {
    byType[l.entry_type] = (byType[l.entry_type] ?? 0) + 1;
  }
  const typesUsed = Object.keys(byType);
  const typesMissing = ALL_ENTRY_TYPES.filter(t => !typesUsed.includes(t));
  const typeDiversityRate = pct(typesUsed.length, ALL_ENTRY_TYPES.length);

  const entry_types: EntryTypeProfile = {
    by_type: byType,
    types_used: typesUsed,
    types_missing: typesMissing,
    type_diversity_rate: typeDiversityRate,
  };

  // ── Mood Tracking ─────────────────────────────────────────────────────
  const withMood = logs14d.filter(l => l.mood_score !== null && l.mood_score !== undefined);
  const moodTrackingRate = pct(withMood.length, logs14d.length);
  const avgMood = withMood.length > 0
    ? Math.round((withMood.reduce((sum, l) => sum + (l.mood_score ?? 0), 0) / withMood.length) * 10) / 10
    : 0;
  const lowMood = withMood.filter(l => (l.mood_score ?? 0) <= 4).length;
  const highMood = withMood.filter(l => (l.mood_score ?? 0) >= 8).length;

  const mood: MoodTrackingProfile = {
    entries_with_mood: withMood.length,
    mood_tracking_rate: moodTrackingRate,
    avg_mood_score: avgMood,
    low_mood_count: lowMood,
    high_mood_count: highMood,
  };

  // ── Staff Participation ───────────────────────────────────────────────
  const staffEntries: Record<string, number> = {};
  for (const l of logs14d) {
    staffEntries[l.staff_id] = (staffEntries[l.staff_id] ?? 0) + 1;
  }
  const uniqueStaff = Object.keys(staffEntries).length;
  const staffParticipationRate = pct(uniqueStaff, total_staff);
  const entryCounts = Object.values(staffEntries);
  const mostActive = entryCounts.length > 0 ? Math.max(...entryCounts) : 0;
  const leastActive = entryCounts.length > 0 ? Math.min(...entryCounts) : 0;

  const staff: StaffParticipationProfile = {
    unique_staff_14d: uniqueStaff,
    staff_participation_rate: staffParticipationRate,
    most_active_staff_entries: mostActive,
    least_active_staff_entries: leastActive,
  };

  // ── Child Coverage ────────────────────────────────────────────────────
  const childEntries: Record<string, number> = {};
  for (const l of logs14d) {
    childEntries[l.child_id] = (childEntries[l.child_id] ?? 0) + 1;
  }
  const childrenWithEntries = Object.keys(childEntries).length;
  const childCoverageRate = pct(childrenWithEntries, total_children);

  const child_coverage: ChildCoverageProfile = {
    children_with_entries_14d: childrenWithEntries,
    children_without: total_children - childrenWithEntries,
    child_coverage_rate: childCoverageRate,
    entries_per_child: childEntries,
  };

  // ── Content Quality ───────────────────────────────────────────────────
  const significantEntries = logs14d.filter(l => l.is_significant).length;
  const significantRate = pct(significantEntries, logs14d.length);
  const avgContentLength = logs14d.length > 0
    ? Math.round(logs14d.reduce((sum, l) => sum + l.content.length, 0) / logs14d.length)
    : 0;
  const incidentLinked = logs14d.filter(l => l.linked_incident_id !== null && l.linked_incident_id !== "").length;

  const quality: ContentQualityProfile = {
    significant_entries: significantEntries,
    significant_rate: significantRate,
    avg_content_length: avgContentLength,
    incident_linked_count: incidentLinked,
  };

  // ── Scoring ───────────────────────────────────────────────────────────
  // Base 52 + max bonuses 28 = 80 (outstanding threshold)
  let score = 52;

  // mod1: Recording frequency (±5) — days with entries out of 14
  const frequencyRate = pct(daysWithEntries, WINDOW_DAYS);
  if (frequencyRate >= 90) score += 5;
  else if (frequencyRate >= 75) score += 3;
  else if (frequencyRate >= 50) score += 0;
  else if (frequencyRate >= 30) score -= 2;
  else score -= 5;

  // mod2: Child coverage (±4) — all children have entries
  if (childCoverageRate >= 100) score += 4;
  else if (childCoverageRate >= 75) score += 2;
  else if (childCoverageRate >= 50) score += 0;
  else score -= 4;

  // mod3: Entry type diversity (±4) — breadth of recording
  if (typeDiversityRate >= 70) score += 4;
  else if (typeDiversityRate >= 50) score += 2;
  else if (typeDiversityRate >= 30) score += 0;
  else score -= 4;

  // mod4: Mood tracking (±3) — entries with mood scores
  if (moodTrackingRate >= 80) score += 3;
  else if (moodTrackingRate >= 60) score += 1;
  else if (moodTrackingRate >= 40) score += 0;
  else if (moodTrackingRate >= 20) score -= 1;
  else score -= 3;

  // mod5: Staff participation (±4) — diverse staff logging
  if (staffParticipationRate >= 70) score += 4;
  else if (staffParticipationRate >= 50) score += 2;
  else if (staffParticipationRate >= 30) score += 0;
  else score -= 4;

  // mod6: Content quality (±3) — average content length
  if (avgContentLength >= 100) score += 3;
  else if (avgContentLength >= 60) score += 1;
  else if (avgContentLength >= 30) score += 0;
  else score -= 3;

  // mod7: Entries per child per day (±3) — sufficient recording volume
  if (entriesPerChildPerDay >= 1.5) score += 3;
  else if (entriesPerChildPerDay >= 1.0) score += 1;
  else if (entriesPerChildPerDay >= 0.5) score += 0;
  else score -= 3;

  // mod8: Significant event flagging (±2) — appropriate use of significance
  if (significantEntries > 0 && significantRate >= 10 && significantRate <= 40) score += 2;
  else if (significantEntries > 0) score += 1;
  else score -= 2;

  // Clamp
  score = Math.max(0, Math.min(100, score));

  // ── Rating ────────────────────────────────────────────────────────────
  let log_rating: DailyLogRating;
  if (score >= 80) log_rating = "outstanding";
  else if (score >= 65) log_rating = "good";
  else if (score >= 45) log_rating = "adequate";
  else log_rating = "inadequate";

  // ── Strengths / Concerns / Recommendations / Insights ─────────────────
  const strengths: string[] = [];
  const concerns: string[] = [];
  const recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[] = [];
  const insights: { text: string; severity: string }[] = [];
  let rank = 0;

  // Strengths
  if (frequencyRate >= 90) strengths.push(`Recording on ${daysWithEntries} of 14 days — consistent daily logging demonstrates embedded practice.`);
  if (childCoverageRate >= 100) strengths.push("Every child has daily log entries — no child is invisible in the recording system.");
  if (typeDiversityRate >= 70) strengths.push(`${typesUsed.length} of ${ALL_ENTRY_TYPES.length} entry types used — holistic recording across all life domains.`);
  if (moodTrackingRate >= 80) strengths.push(`Mood tracked in ${moodTrackingRate}% of entries — strong emotional monitoring.`);
  if (staffParticipationRate >= 70) strengths.push(`${uniqueStaff} staff contributing — shared recording responsibility across the team.`);
  if (avgContentLength >= 100) strengths.push("Detailed entries averaging " + avgContentLength + " characters — rich, meaningful recording.");

  // Concerns
  if (daysWithNoEntries >= 5) concerns.push(`${daysWithNoEntries} days with no entries in the last 14 days — recording gaps could hide safeguarding concerns.`);
  if (childCoverageRate < 100 && total_children > childrenWithEntries) {
    concerns.push(`${total_children - childrenWithEntries} child${(total_children - childrenWithEntries) > 1 ? "ren" : ""} with no daily log entries in 14 days.`);
  }
  if (moodTrackingRate < 40) concerns.push(`Mood tracking at only ${moodTrackingRate}% — emotional wellbeing may not be monitored effectively.`);
  if (avgContentLength < 30) concerns.push("Very brief log entries — insufficient detail for safeguarding oversight.");
  if (staffParticipationRate < 30) concerns.push(`Only ${uniqueStaff} of ${total_staff} staff contributing to daily logs — recording may not reflect all shifts.`);
  if (lowMood >= 5) concerns.push(`${lowMood} entries with low mood scores (≤4) in 14 days — patterns of distress should be explored.`);

  // Recommendations
  if (daysWithNoEntries >= 3) {
    recommendations.push({ rank: ++rank, recommendation: "Embed daily recording into shift routines — every shift must produce at least one entry per child.", urgency: daysWithNoEntries >= 7 ? "immediate" : "soon", regulatory_ref: "Reg 36" });
  }
  if (childCoverageRate < 100) {
    recommendations.push({ rank: ++rank, recommendation: "Ensure all children have daily log entries — use handover checklists to verify coverage.", urgency: "soon", regulatory_ref: "Reg 36" });
  }
  if (moodTrackingRate < 60) {
    recommendations.push({ rank: ++rank, recommendation: "Include mood scores in all daily log entries to build emotional wellbeing patterns.", urgency: "planned", regulatory_ref: "Reg 36" });
  }
  if (typesMissing.length > 3) {
    recommendations.push({ rank: ++rank, recommendation: `Record across all life domains — missing types: ${typesMissing.slice(0, 3).join(", ")}.`, urgency: "planned", regulatory_ref: "Reg 36" });
  }
  if (staffParticipationRate < 50) {
    recommendations.push({ rank: ++rank, recommendation: "All staff should contribute to daily logs — discuss recording expectations in supervision.", urgency: "soon", regulatory_ref: "Reg 36" });
  }

  // ARIA Insights
  if (frequencyRate >= 90 && childCoverageRate >= 100 && typeDiversityRate >= 70 && moodTrackingRate >= 80) {
    insights.push({ text: "Daily log recording is exemplary. Consistent, comprehensive, and emotionally attuned recording across all children and life domains. Ofsted will recognise this as outstanding practice.", severity: "positive" });
  }
  if (lowMood >= 3 && pct(lowMood, withMood.length) >= 20) {
    insights.push({ text: `${lowMood} low mood entries detected (${pct(lowMood, withMood.length)}% of mood-tracked entries). Consider whether therapeutic interventions are needed — persistent low mood may indicate unmet emotional needs.`, severity: "warning" });
  }
  if (daysWithNoEntries >= 7) {
    insights.push({ text: `${daysWithNoEntries} days without any recording in the last 14 days. This is a significant governance concern — Ofsted will view recording gaps as a leadership and management failure.`, severity: "critical" });
  }
  if (entryCounts.length >= 2 && mostActive > leastActive * 3) {
    insights.push({ text: `Recording workload is unevenly distributed — one staff member logged ${mostActive} entries while another logged only ${leastActive}. Consider redistributing recording responsibilities.`, severity: "warning" });
  }

  // ── Headline ──────────────────────────────────────────────────────────
  let headline: string;
  if (log_rating === "outstanding") {
    headline = `Outstanding daily recording — ${logs14d.length} entries across ${daysWithEntries} days covering all ${childrenWithEntries} children.`;
  } else if (log_rating === "good") {
    headline = `Good recording practice — ${logs14d.length} entries in 14 days. ${concerns.length > 0 ? concerns.length + " area" + (concerns.length > 1 ? "s" : "") + " for improvement." : ""}`;
  } else if (log_rating === "adequate") {
    headline = `Recording requires improvement — ${logs14d.length} entries with ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified.`;
  } else {
    headline = `Daily recording is inadequate — ${daysWithNoEntries} day${daysWithNoEntries !== 1 ? "s" : ""} without entries. Immediate improvement needed.`;
  }

  return {
    log_rating,
    log_score: score,
    headline,
    frequency,
    entry_types,
    mood,
    staff,
    child_coverage,
    quality,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
