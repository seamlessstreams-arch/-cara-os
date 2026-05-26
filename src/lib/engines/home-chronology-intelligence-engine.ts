// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME CHRONOLOGY INTELLIGENCE ENGINE
// Home-level: analyses chronology event patterns, documentation quality,
// category distribution, significance tracking, and incident linkage
// across all children at the home.
// CHR 2015 Reg 36 (Record Keeping). SCCIF: "Well-Led."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface ChronologyEntryInput {
  id: string;
  child_id: string;
  date: string;
  category: string;             // placement | education | missing | review | health | behaviour | safeguarding | contact | legal
  significance: string;         // critical | significant | routine
  has_linked_incident: boolean;
  has_description: boolean;
  has_time: boolean;
}

export interface HomeChronologyInput {
  today: string;
  entries: ChronologyEntryInput[];
  total_children: number;
  lookback_days?: number;       // default 180
}

// ── Output Types ────────────────────────────────────────────────────────────

export type ChronologyRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface EventDistributionProfile {
  total_entries: number;
  critical_count: number;
  significant_count: number;
  routine_count: number;
  categories_used: number;
  category_breakdown: Record<string, number>;
}

export interface CoverageProfile {
  children_with_entries: number;
  children_without_entries: number;
  coverage_rate: number;
  avg_entries_per_child: number;
  min_entries: number;
  max_entries: number;
}

export interface QualityProfile {
  description_rate: number;
  time_recording_rate: number;
  incident_linked_rate: number;
  critical_with_incident_rate: number;
}

export interface TimelinessProfile {
  entries_last_30_days: number;
  entries_last_90_days: number;
  entries_per_month: number;        // avg across lookback
  recording_gap_days: number;       // longest gap between consecutive entries (all children)
}

export interface ChronologyInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface ChronologyRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface HomeChronologyResult {
  chronology_rating: ChronologyRating;
  chronology_score: number;
  headline: string;
  event_distribution: EventDistributionProfile;
  coverage_profile: CoverageProfile;
  quality_profile: QualityProfile;
  timeliness_profile: TimelinessProfile;
  strengths: string[];
  concerns: string[];
  recommendations: ChronologyRecommendation[];
  insights: ChronologyInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): ChronologyRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000,
  );
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeHomeChronology(
  input: HomeChronologyInput,
): HomeChronologyResult {
  const { today, total_children, lookback_days = 180 } = input;

  // Lookback window
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() - lookback_days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const entries = input.entries.filter(e => e.date >= cutoffStr && e.date <= today);

  // Insufficient data: no entries in lookback
  if (entries.length === 0) {
    return {
      chronology_rating: "insufficient_data",
      chronology_score: 0,
      headline: "No chronology entries found — event recording cannot be assessed.",
      event_distribution: emptyEventDist(),
      coverage_profile: emptyCoverage(total_children),
      quality_profile: emptyQuality(),
      timeliness_profile: emptyTimeliness(),
      strengths: [],
      concerns: ["No chronology entries recorded — Ofsted expects comprehensive records of significant events for each child."],
      recommendations: [{ rank: 1, recommendation: "Begin recording all significant events in the chronology for every child in placement.", urgency: "immediate", regulatory_ref: "Reg 36" }],
      insights: [{ text: "No chronology entries found within the review period. A chronology is a critical record-keeping tool — it provides an at-a-glance timeline of every significant event in a child's life. Without it, Ofsted cannot assess whether the home is maintaining adequate records or tracking patterns of concern.", severity: "critical" }],
    };
  }

  // ── Event Distribution ─────────────────────────────────────────────
  const critical = entries.filter(e => e.significance === "critical");
  const significant = entries.filter(e => e.significance === "significant");
  const routine = entries.filter(e => e.significance === "routine");

  const categoryMap: Record<string, number> = {};
  for (const e of entries) {
    categoryMap[e.category] = (categoryMap[e.category] ?? 0) + 1;
  }

  const eventDist: EventDistributionProfile = {
    total_entries: entries.length,
    critical_count: critical.length,
    significant_count: significant.length,
    routine_count: routine.length,
    categories_used: Object.keys(categoryMap).length,
    category_breakdown: categoryMap,
  };

  // ── Coverage Profile ───────────────────────────────────────────────
  const childEntryMap: Record<string, number> = {};
  for (const e of entries) {
    childEntryMap[e.child_id] = (childEntryMap[e.child_id] ?? 0) + 1;
  }
  const childrenWithEntries = Object.keys(childEntryMap).length;
  const childrenWithout = Math.max(0, total_children - childrenWithEntries);
  const entryCounts = Object.values(childEntryMap);
  const minEntries = entryCounts.length > 0 ? Math.min(...entryCounts) : 0;
  const maxEntries = entryCounts.length > 0 ? Math.max(...entryCounts) : 0;
  const avgEntries = total_children > 0
    ? Math.round((entries.length / total_children) * 10) / 10
    : 0;

  const coverageProfile: CoverageProfile = {
    children_with_entries: childrenWithEntries,
    children_without_entries: childrenWithout,
    coverage_rate: pct(childrenWithEntries, total_children),
    avg_entries_per_child: avgEntries,
    min_entries: minEntries,
    max_entries: maxEntries,
  };

  // ── Quality Profile ────────────────────────────────────────────────
  const withDesc = entries.filter(e => e.has_description);
  const withTime = entries.filter(e => e.has_time);
  const withIncident = entries.filter(e => e.has_linked_incident);
  const criticalWithIncident = critical.filter(e => e.has_linked_incident);

  const qualityProfile: QualityProfile = {
    description_rate: pct(withDesc.length, entries.length),
    time_recording_rate: pct(withTime.length, entries.length),
    incident_linked_rate: pct(withIncident.length, entries.length),
    critical_with_incident_rate: pct(criticalWithIncident.length, critical.length),
  };

  // ── Timeliness Profile ─────────────────────────────────────────────
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyStr = thirtyDaysAgo.toISOString().slice(0, 10);

  const ninetyDaysAgo = new Date(today);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const ninetyStr = ninetyDaysAgo.toISOString().slice(0, 10);

  const last30 = entries.filter(e => e.date >= thirtyStr);
  const last90 = entries.filter(e => e.date >= ninetyStr);

  const months = lookback_days / 30;
  const entriesPerMonth = months > 0 ? Math.round((entries.length / months) * 10) / 10 : 0;

  // Recording gap: largest gap between consecutive entries
  const sortedDates = [...entries].sort((a, b) => a.date.localeCompare(b.date)).map(e => e.date);
  let maxGap = 0;
  for (let i = 1; i < sortedDates.length; i++) {
    const gap = daysBetween(sortedDates[i - 1], sortedDates[i]);
    if (gap > maxGap) maxGap = gap;
  }
  // Also check gap from last entry to today
  if (sortedDates.length > 0) {
    const gapToToday = daysBetween(sortedDates[sortedDates.length - 1], today);
    if (gapToToday > maxGap) maxGap = gapToToday;
  }

  const timelinessProfile: TimelinessProfile = {
    entries_last_30_days: last30.length,
    entries_last_90_days: last90.length,
    entries_per_month: entriesPerMonth,
    recording_gap_days: maxGap,
  };

  // ── Scoring ───────────────────────────────────────────────────────
  // Base 52, max bonuses = 28, 52+28 = 80
  let score = 52;

  // 1. Child coverage (±5)
  if (coverageProfile.coverage_rate === 100) score += 5;
  else if (coverageProfile.coverage_rate >= 80) score += 2;
  else if (coverageProfile.coverage_rate >= 50) score -= 1;
  else score -= 4;

  // 2. Description quality (±4)
  if (qualityProfile.description_rate >= 90) score += 4;
  else if (qualityProfile.description_rate >= 70) score += 2;
  else if (qualityProfile.description_rate >= 50) score -= 1;
  else score -= 3;

  // 3. Recording frequency (±3)
  if (entriesPerMonth >= 3) score += 3;
  else if (entriesPerMonth >= 1.5) score += 1;
  else if (entriesPerMonth >= 0.5) score -= 1;
  else score -= 3;

  // 4. Category diversity (±3)
  if (eventDist.categories_used >= 5) score += 3;
  else if (eventDist.categories_used >= 3) score += 1;
  else score -= 2;

  // 5. Time recording (±3)
  if (qualityProfile.time_recording_rate >= 70) score += 3;
  else if (qualityProfile.time_recording_rate >= 40) score += 1;
  else score -= 2;

  // 6. Critical event documentation (±4)
  if (critical.length > 0) {
    if (qualityProfile.critical_with_incident_rate >= 80) score += 4;
    else if (qualityProfile.critical_with_incident_rate >= 50) score += 1;
    else score -= 2;
  } else {
    score += 1; // No critical events = no concern
  }

  // 7. Recording gaps (±3)
  if (maxGap <= 14) score += 3;
  else if (maxGap <= 30) score += 1;
  else if (maxGap <= 60) score -= 1;
  else score -= 3;

  // 8. Balance across children (±3)
  if (total_children > 1 && entryCounts.length >= total_children) {
    const ratio = minEntries / maxEntries;
    if (ratio >= 0.5) score += 3;
    else if (ratio >= 0.25) score += 1;
    else score -= 2;
  } else if (total_children <= 1) {
    score += 1;
  } else {
    score -= 2; // Some children missing
  }

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (coverageProfile.coverage_rate === 100) strengths.push(`All ${total_children} children have chronology entries — comprehensive event recording.`);
  if (qualityProfile.description_rate >= 90) strengths.push(`${qualityProfile.description_rate}% of entries include descriptions — detailed event documentation.`);
  if (entriesPerMonth >= 3) strengths.push(`${entriesPerMonth} entries per month — proactive event recording.`);
  if (eventDist.categories_used >= 5) strengths.push(`Events recorded across ${eventDist.categories_used} categories — comprehensive life-event tracking.`);
  if (qualityProfile.time_recording_rate >= 70) strengths.push(`${qualityProfile.time_recording_rate}% of entries record the time — detailed contemporaneous records.`);
  if (critical.length > 0 && qualityProfile.critical_with_incident_rate >= 80) strengths.push(`${qualityProfile.critical_with_incident_rate}% of critical events linked to incidents — robust cross-referencing.`);
  if (maxGap <= 14) strengths.push("No recording gap exceeds 14 days — consistent chronology maintenance.");

  // ── Concerns ──────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (childrenWithout > 0) concerns.push(`${childrenWithout} child${childrenWithout > 1 ? "ren have" : " has"} no chronology entries — every child's significant events must be recorded.`);
  if (qualityProfile.description_rate < 70) concerns.push(`Only ${qualityProfile.description_rate}% of entries include descriptions — events lack sufficient detail.`);
  if (maxGap > 30) concerns.push(`Longest recording gap is ${maxGap} days — significant periods unrecorded.`);
  if (entriesPerMonth < 1) concerns.push(`Only ${entriesPerMonth} entries per month — recording frequency is too low to capture significant events.`);
  if (critical.length > 0 && qualityProfile.critical_with_incident_rate < 50) concerns.push(`Only ${qualityProfile.critical_with_incident_rate}% of critical events linked to incidents — critical events must be cross-referenced.`);
  if (eventDist.categories_used < 3) concerns.push(`Events recorded in only ${eventDist.categories_used} categor${eventDist.categories_used === 1 ? "y" : "ies"} — chronologies should capture placement, health, education, safeguarding and more.`);

  // ── Recommendations ───────────────────────────────────────────────
  const recs: ChronologyRecommendation[] = [];
  let rank = 1;

  if (childrenWithout > 0) {
    recs.push({ rank: rank++, recommendation: `Create chronology entries for ${childrenWithout} child${childrenWithout > 1 ? "ren" : ""} without records — every child must have a complete event timeline.`, urgency: "immediate", regulatory_ref: "Reg 36" });
  }
  if (maxGap > 30) {
    recs.push({ rank: rank++, recommendation: `Address ${maxGap}-day recording gap — implement weekly chronology review to prevent lapses.`, urgency: "soon", regulatory_ref: "Reg 36" });
  }
  if (qualityProfile.description_rate < 70) {
    recs.push({ rank: rank++, recommendation: "Improve event descriptions — staff should record the what, who, when, and outcome for every chronology entry.", urgency: "soon", regulatory_ref: "Reg 36" });
  }
  if (critical.length > 0 && qualityProfile.critical_with_incident_rate < 50) {
    recs.push({ rank: rank++, recommendation: "Link critical chronology events to incident records — ensures regulatory traceability.", urgency: "soon", regulatory_ref: "Reg 36" });
  }
  if (eventDist.categories_used < 3) {
    recs.push({ rank: rank++, recommendation: "Broaden chronology categories — ensure health, education, safeguarding, and contact events are all captured.", urgency: "planned", regulatory_ref: "Reg 36" });
  }

  // ── Insights ──────────────────────────────────────────────────────
  const insights: ChronologyInsight[] = [];

  if (coverageProfile.coverage_rate === 100 && qualityProfile.description_rate >= 90 && entriesPerMonth >= 3) {
    insights.push({ text: `Chronology practice is exemplary — all ${total_children} children covered, ${qualityProfile.description_rate}% detailed descriptions, and ${entriesPerMonth} entries per month. Ofsted will see a home that maintains thorough, contemporaneous records of every child's significant life events, supporting both daily practice and statutory reviews.`, severity: "positive" });
  }
  if (childrenWithout > 0) {
    insights.push({ text: `${childrenWithout} child${childrenWithout > 1 ? "ren have" : " has"} no chronology entries. A chronology is the primary documentary evidence of a child's journey through care. Without it, the home cannot demonstrate awareness of patterns, cannot support LAC reviews effectively, and will face criticism from Ofsted for incomplete record-keeping.`, severity: "critical" });
  }
  if (maxGap > 30) {
    insights.push({ text: `A ${maxGap}-day gap in chronology recording suggests events may have occurred without being documented. Regulation 36 requires that records are kept of significant events — gaps this long risk missing important patterns or failing to evidence the home's response to events.`, severity: "warning" });
  }
  if (critical.length > 0 && qualityProfile.critical_with_incident_rate < 50) {
    insights.push({ text: `Only ${qualityProfile.critical_with_incident_rate}% of critical chronology events are linked to incident records. Cross-referencing is essential — it allows reviewers to trace from chronology to incident detail, demonstrating the home's systematic approach to documenting and responding to serious events.`, severity: "warning" });
  }

  // ── Headline ──────────────────────────────────────────────────────
  let headline: string;
  if (rating === "outstanding") {
    headline = `Outstanding chronology practice — ${entries.length} entries, ${eventDist.categories_used} categories, all ${total_children} children covered.`;
  } else if (rating === "good") {
    headline = `Good chronology recording — most children covered with minor quality gaps.`;
  } else if (rating === "adequate") {
    headline = "Adequate chronology — coverage gaps or quality issues need addressing.";
  } else {
    headline = "Chronology practice is inadequate — significant gaps in coverage, quality, or frequency.";
  }

  return {
    chronology_rating: rating,
    chronology_score: score,
    headline,
    event_distribution: eventDist,
    coverage_profile: coverageProfile,
    quality_profile: qualityProfile,
    timeliness_profile: timelinessProfile,
    strengths,
    concerns,
    recommendations: recs,
    insights,
  };
}

// ── Empty Profiles ──────────────────────────────────────────────────────────

function emptyEventDist(): EventDistributionProfile {
  return { total_entries: 0, critical_count: 0, significant_count: 0, routine_count: 0, categories_used: 0, category_breakdown: {} };
}

function emptyCoverage(total: number): CoverageProfile {
  return { children_with_entries: 0, children_without_entries: total, coverage_rate: 0, avg_entries_per_child: 0, min_entries: 0, max_entries: 0 };
}

function emptyQuality(): QualityProfile {
  return { description_rate: 0, time_recording_rate: 0, incident_linked_rate: 0, critical_with_incident_rate: 0 };
}

function emptyTimeliness(): TimelinessProfile {
  return { entries_last_30_days: 0, entries_last_90_days: 0, entries_per_month: 0, recording_gap_days: 0 };
}
