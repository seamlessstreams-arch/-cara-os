// ══════════════════════════════════════════════════════════════════════════════
// CARA — RECORDING QUALITY INTELLIGENCE ENGINE
//
// Pure deterministic engine that analyses daily log recording compliance,
// quality scores, staff recording profiles, and child mention coverage.
//
// Key regulatory requirements:
//   Reg 36 — records must be accurate, up-to-date, and stored securely
//   SCCIF  — evidence of day-to-day experiences of children
//   Records must include child voice, mood, and reflective analysis
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ────────────────────────────────────────────────────────────

export interface DailyLogInput {
  id: string;
  child_id: string;
  date: string;
  time: string;
  entry_type: string;
  content: string;
  mood_score: number | null;
  staff_id: string;
  is_significant: boolean;
}

export interface ChildRef {
  id: string;
  name: string;
}

export interface StaffRef {
  id: string;
  name: string;
}

// ── Output Types ───────────────────────────────────────────────────────────

export interface RecordingQualityIntelligenceResult {
  overview: RecordingOverview;
  quality_breakdown: QualityBreakdown;
  staff_profiles: StaffRecordingProfile[];
  child_coverage: ChildRecordingCoverage[];
  alerts: RecordingAlert[];
  insights: CaraRecordingInsight[];
}

export interface RecordingOverview {
  total_entries: number;
  entries_last_7_days: number;
  avg_entries_per_day: number;
  avg_content_length: number;
  mood_capture_rate: number;
  significant_events_count: number;
  entry_type_coverage: number;
  children_with_entries_today: number;
}

export interface QualityBreakdown {
  excellent: number;
  good: number;
  adequate: number;
  poor: number;
}

export interface StaffRecordingProfile {
  staff_id: string;
  staff_name: string;
  total_records: number;
  avg_word_count: number;
  mood_capture_rate: number;
  quality_label: string;
  trend: "improving" | "stable" | "declining";
}

export interface ChildRecordingCoverage {
  child_id: string;
  child_name: string;
  entries_last_7_days: number;
  days_without_entry: number;
  has_entry_today: boolean;
  entry_types_used: string[];
}

export interface RecordingAlert {
  severity: "critical" | "high" | "medium" | "low";
  message: string;
}

export interface CaraRecordingInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

// ── Constants ──────────────────────────────────────────────────────────────

const ALL_ENTRY_TYPES = [
  "general",
  "behaviour",
  "health",
  "education",
  "contact",
  "activity",
  "mood",
  "sleep",
  "food",
] as const;

const TOTAL_ENTRY_TYPES = ALL_ENTRY_TYPES.length; // 9

// ── Helpers ────────────────────────────────────────────────────────────────

export function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function dateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function daysAgo(today: string, n: number): string {
  const d = new Date(today + "T00:00:00");
  d.setDate(d.getDate() - n);
  return dateStr(d);
}

function last7Dates(today: string): string[] {
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    dates.push(daysAgo(today, i));
  }
  return dates;
}

function classifyEntry(entry: DailyLogInput): "excellent" | "good" | "adequate" | "poor" {
  const wc = wordCount(entry.content);
  const hasMood = entry.mood_score !== null && entry.mood_score !== undefined;

  if (wc >= 100 && hasMood) return "excellent";
  if (wc >= 50 || (wc >= 30 && hasMood)) return "good";
  if (wc >= 15) return "adequate";
  return "poor";
}

function qualityLabel(avgWordCount: number): string {
  if (avgWordCount >= 100) return "Excellent";
  if (avgWordCount >= 50) return "Good";
  if (avgWordCount >= 15) return "Adequate";
  return "Poor";
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

// ── Engine ─────────────────────────────────────────────────────────────────

export function computeRecordingQualityIntelligence(input: {
  entries: DailyLogInput[];
  children: ChildRef[];
  staff: StaffRef[];
  today?: string;
}): RecordingQualityIntelligenceResult {
  const today = input.today ?? dateStr(new Date());
  const dates7 = new Set(last7Dates(today));
  const allEntries = input.entries;
  const recent = allEntries.filter((e) => dates7.has(e.date));

  // ── Overview ─────────────────────────────────────────────────────────
  const totalEntries = allEntries.length;
  const entriesLast7 = recent.length;

  // Unique days with entries in the last 7
  const uniqueDays = new Set(recent.map((e) => e.date));
  const avgEntriesPerDay =
    uniqueDays.size > 0 ? round1(entriesLast7 / 7) : 0;

  const wordCounts = allEntries.map((e) => wordCount(e.content));
  const avgContentLength =
    wordCounts.length > 0
      ? round1(wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length)
      : 0;

  const withMood = allEntries.filter(
    (e) => e.mood_score !== null && e.mood_score !== undefined,
  );
  const moodCaptureRate =
    allEntries.length > 0
      ? round1((withMood.length / allEntries.length) * 100)
      : 0;

  const significantEventsCount = allEntries.filter((e) => e.is_significant).length;

  const usedTypes = new Set(allEntries.map((e) => e.entry_type));
  const entryTypeCoverage = round1((usedTypes.size / TOTAL_ENTRY_TYPES) * 100);

  const todayEntries = allEntries.filter((e) => e.date === today);
  const childrenWithEntriesToday = new Set(todayEntries.map((e) => e.child_id)).size;

  const overview: RecordingOverview = {
    total_entries: totalEntries,
    entries_last_7_days: entriesLast7,
    avg_entries_per_day: avgEntriesPerDay,
    avg_content_length: avgContentLength,
    mood_capture_rate: moodCaptureRate,
    significant_events_count: significantEventsCount,
    entry_type_coverage: entryTypeCoverage,
    children_with_entries_today: childrenWithEntriesToday,
  };

  // ── Quality breakdown ────────────────────────────────────────────────
  const qualityBreakdown: QualityBreakdown = {
    excellent: 0,
    good: 0,
    adequate: 0,
    poor: 0,
  };
  for (const entry of allEntries) {
    const cls = classifyEntry(entry);
    qualityBreakdown[cls]++;
  }

  // ── Staff profiles ───────────────────────────────────────────────────
  const staffMap = new Map(input.staff.map((s) => [s.id, s.name]));
  const staffEntries = new Map<string, DailyLogInput[]>();
  for (const entry of recent) {
    if (!staffEntries.has(entry.staff_id)) {
      staffEntries.set(entry.staff_id, []);
    }
    staffEntries.get(entry.staff_id)!.push(entry);
  }

  // Date boundaries for trend: first half = days 4-7 ago, second half = days 0-3 ago
  const secondHalfDates = new Set([
    daysAgo(today, 0),
    daysAgo(today, 1),
    daysAgo(today, 2),
    daysAgo(today, 3),
  ]);
  const firstHalfDates = new Set([
    daysAgo(today, 4),
    daysAgo(today, 5),
    daysAgo(today, 6),
  ]);

  const staffProfiles: StaffRecordingProfile[] = [];
  for (const s of input.staff) {
    const entries = staffEntries.get(s.id) ?? [];
    if (entries.length === 0) continue;

    const wcs = entries.map((e) => wordCount(e.content));
    const avgWc = round1(wcs.reduce((a, b) => a + b, 0) / wcs.length);
    const withMoodCount = entries.filter(
      (e) => e.mood_score !== null && e.mood_score !== undefined,
    ).length;
    const moodRate = round1((withMoodCount / entries.length) * 100);

    // Trend analysis
    const firstHalf = entries.filter((e) => firstHalfDates.has(e.date));
    const secondHalf = entries.filter((e) => secondHalfDates.has(e.date));
    let trend: "improving" | "stable" | "declining" = "stable";
    if (firstHalf.length > 0 && secondHalf.length > 0) {
      const fhAvg =
        firstHalf.map((e) => wordCount(e.content)).reduce((a, b) => a + b, 0) /
        firstHalf.length;
      const shAvg =
        secondHalf.map((e) => wordCount(e.content)).reduce((a, b) => a + b, 0) /
        secondHalf.length;
      if (fhAvg > 0) {
        const change = (shAvg - fhAvg) / fhAvg;
        if (change > 0.1) trend = "improving";
        else if (change < -0.1) trend = "declining";
      }
    }

    staffProfiles.push({
      staff_id: s.id,
      staff_name: staffMap.get(s.id) ?? s.id,
      total_records: entries.length,
      avg_word_count: avgWc,
      mood_capture_rate: moodRate,
      quality_label: qualityLabel(avgWc),
      trend,
    });
  }

  // ── Child coverage ───────────────────────────────────────────────────
  const dates7List = last7Dates(today);
  const childCoverage: ChildRecordingCoverage[] = input.children.map((child) => {
    const childEntries = recent.filter((e) => e.child_id === child.id);
    const entryDates = new Set(childEntries.map((e) => e.date));
    const daysWithout = dates7List.filter((d) => !entryDates.has(d)).length;
    const hasToday = todayEntries.some((e) => e.child_id === child.id);
    const typesUsed = [...new Set(childEntries.map((e) => e.entry_type))].sort();

    return {
      child_id: child.id,
      child_name: child.name,
      entries_last_7_days: childEntries.length,
      days_without_entry: daysWithout,
      has_entry_today: hasToday,
      entry_types_used: typesUsed,
    };
  });

  // ── Alerts ───────────────────────────────────────────────────────────
  const alerts: RecordingAlert[] = [];

  // Critical: child with 0 entries in 7 days
  for (const cc of childCoverage) {
    if (cc.entries_last_7_days === 0) {
      alerts.push({
        severity: "critical",
        message: `No daily records for ${cc.child_name} in the last 7 days — Reg 36 breach`,
      });
    }
  }

  // High: child with no entry today
  for (const cc of childCoverage) {
    if (!cc.has_entry_today) {
      alerts.push({
        severity: "high",
        message: `${cc.child_name} has no daily record today`,
      });
    }
  }

  // Medium: avg content length < 30 words
  if (avgContentLength < 30 && allEntries.length > 0) {
    alerts.push({
      severity: "medium",
      message: `Average recording length ${avgContentLength} words — below minimum standard`,
    });
  }

  // Medium: mood capture rate < 50%
  if (moodCaptureRate < 50 && allEntries.length > 0) {
    alerts.push({
      severity: "medium",
      message: `Mood score recorded in only ${moodCaptureRate}% of entries — target 80%`,
    });
  }

  // Low: staff with declining trend
  for (const sp of staffProfiles) {
    if (sp.trend === "declining") {
      alerts.push({
        severity: "low",
        message: `${sp.staff_name} recording quality is declining — address in supervision`,
      });
    }
  }

  // ── Insights ─────────────────────────────────────────────────────────
  const insights: CaraRecordingInsight[] = [];

  // Critical: child with no entries in 7 days
  for (const cc of childCoverage) {
    if (cc.entries_last_7_days === 0) {
      insights.push({
        severity: "critical",
        text: `${cc.child_name} has no daily records in the past 7 days. This is a Reg 36 breach requiring immediate action.`,
      });
    }
  }

  // Warning: low word count
  if (avgContentLength < 30 && allEntries.length > 0) {
    insights.push({
      severity: "warning",
      text: `Average recording length is ${avgContentLength} words. Recordings should capture sufficient detail to evidence day-to-day experiences.`,
    });
  }

  // Warning: low mood capture
  if (moodCaptureRate < 50 && allEntries.length > 0) {
    insights.push({
      severity: "warning",
      text: `Mood scores are captured in only ${moodCaptureRate}% of entries. Target is 80% to evidence child wellbeing monitoring.`,
    });
  }

  // Warning: poor quality entries >20%
  const poorRate =
    allEntries.length > 0
      ? round1((qualityBreakdown.poor / allEntries.length) * 100)
      : 0;
  if (poorRate > 20) {
    insights.push({
      severity: "warning",
      text: `${poorRate}% of recordings are classified as poor quality. Targeted recording training is recommended.`,
    });
  }

  // Positive: all children covered daily (all have entry today)
  const allCoveredToday = childCoverage.every((cc) => cc.has_entry_today);
  if (allCoveredToday && input.children.length > 0) {
    insights.push({
      severity: "positive",
      text: "All children have daily records today. Excellent recording compliance.",
    });
  }

  // Positive: high mood capture >=80%
  if (moodCaptureRate >= 80 && allEntries.length > 0) {
    insights.push({
      severity: "positive",
      text: `Mood capture rate is ${moodCaptureRate}%. Strong evidence of child wellbeing monitoring.`,
    });
  }

  // Positive: high avg word count >=50
  if (avgContentLength >= 50 && allEntries.length > 0) {
    insights.push({
      severity: "positive",
      text: `Average recording length is ${avgContentLength} words. Recordings are detailed and evidence-rich.`,
    });
  }

  // Positive: all staff improving or stable
  const allStaffOk =
    staffProfiles.length > 0 &&
    staffProfiles.every((sp) => sp.trend === "improving" || sp.trend === "stable");
  if (allStaffOk) {
    insights.push({
      severity: "positive",
      text: "All staff recording quality is stable or improving. No supervision concerns.",
    });
  }

  return {
    overview,
    quality_breakdown: qualityBreakdown,
    staff_profiles: staffProfiles,
    child_coverage: childCoverage,
    alerts,
    insights,
  };
}
