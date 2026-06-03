// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — RECORDING QUALITY TREND ENGINE
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
//
// Composes the Recording Quality engine over TIME: it buckets the per-record
// scores into weekly windows and tracks the trajectory of overall quality and of
// each dimension — especially the child's voice, the usual weak spot. This closes
// the improvement loop: after coaching, is recording actually getting better, or
// is the gap persistent?
//
// Regulatory: CHR 2015 Reg 13 (leadership — driving improvement), Reg 36 (records),
// Reg 33 (staff development). SCCIF: leaders know whether quality is improving.
// ══════════════════════════════════════════════════════════════════════════════

import type { ScoredRecord, DimensionAverages } from "@/lib/recording-quality/recording-quality-engine";

// ── Input ─────────────────────────────────────────────────────────────────────

export interface RecordingQualityTrendInput {
  records: ScoredRecord[];   // output of computeRecordingQuality (each carries a date)
  weeks?: number;            // how many weekly buckets back (default 8)
  today?: string;            // ISO date — injectable for deterministic tests
}

// ── Output ────────────────────────────────────────────────────────────────────

export type TrendDirection = "improving" | "declining" | "stable" | "insufficient_data";

export interface WeeklyPoint {
  week_start: string;        // ISO date (start of the 7-day window)
  label: string;             // e.g. "w/c 2026-05-12"
  count: number;
  avg_overall: number;
  child_voice: number;
  dimension_averages: DimensionAverages;
}

export interface RecordingQualityTrendOverview {
  weeks_covered: number;
  populated_weeks: number;
  current_avg: number;
  overall_trend: TrendDirection;
  overall_change: number;        // later-half mean minus earlier-half mean
  childvoice_current: number;
  childvoice_trend: TrendDirection;
  childvoice_change: number;
}

export interface TrendAlert {
  severity: "critical" | "high" | "medium" | "low";
  message: string;
}
export interface AriaTrendInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface RecordingQualityTrendResult {
  overview: RecordingQualityTrendOverview;
  series: WeeklyPoint[];
  alerts: TrendAlert[];
  insights: AriaTrendInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const DIM_KEYS: (keyof DimensionAverages)[] = [
  "completeness", "clarity", "professionalLanguage", "factuality", "childCentredness", "riskRelevance",
];

function daysAgo(date: string, today: string): number {
  return Math.floor((new Date(today).getTime() - new Date(date).getTime()) / 86_400_000);
}
function addDays(date: string, n: number): string {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
function round(n: number): number { return Math.round(n); }
function mean(arr: number[]): number { return arr.length === 0 ? 0 : arr.reduce((s, v) => s + v, 0) / arr.length; }

function directionOf(earlier: number, later: number): TrendDirection {
  const diff = later - earlier;
  if (diff >= 3) return "improving";
  if (diff <= -3) return "declining";
  return "stable";
}

/** Compare the mean of the earlier half of populated weeks with the later half. */
function trendOverPoints(points: WeeklyPoint[], sel: (p: WeeklyPoint) => number): { dir: TrendDirection; change: number } {
  const populated = points.filter((p) => p.count > 0);
  if (populated.length < 2) return { dir: "insufficient_data", change: 0 };
  const mid = Math.floor(populated.length / 2);
  const earlier = mean(populated.slice(0, mid).map(sel));
  const later = mean(populated.slice(populated.length - mid).map(sel));
  return { dir: directionOf(earlier, later), change: round(later - earlier) };
}

// ── Main Computation ────────────────────────────────────────────────────────

export function computeRecordingQualityTrend(input: RecordingQualityTrendInput): RecordingQualityTrendResult {
  const today = input.today ?? new Date().toISOString().slice(0, 10);
  const weeks = input.weeks ?? 8;

  // Bucket records into weekly windows. Bucket i covers [i*7, (i+1)*7) days ago.
  const buckets: ScoredRecord[][] = Array.from({ length: weeks }, () => []);
  for (const r of input.records) {
    if (!r.date) continue;
    const d = daysAgo(r.date, today);
    if (d < 0) continue;
    const i = Math.floor(d / 7);
    if (i < weeks) buckets[i].push(r);
  }

  // Build chronological series (oldest week first).
  const series: WeeklyPoint[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const recs = buckets[i];
    const n = recs.length;
    const avgDim = (k: keyof DimensionAverages) => (n === 0 ? 0 : round(mean(recs.map((r) => r.score[k]))));
    const dimension_averages = Object.fromEntries(DIM_KEYS.map((k) => [k, avgDim(k)])) as unknown as DimensionAverages;
    const weekStart = addDays(today, -((i + 1) * 7 - 1)); // start of this 7-day window
    series.push({
      week_start: weekStart,
      label: `w/c ${weekStart}`,
      count: n,
      avg_overall: n === 0 ? 0 : round(mean(recs.map((r) => r.overall))),
      child_voice: avgDim("childCentredness"),
      dimension_averages,
    });
  }

  const overallTrend = trendOverPoints(series, (p) => p.avg_overall);
  const voiceTrend = trendOverPoints(series, (p) => p.child_voice);
  const populated = series.filter((p) => p.count > 0);
  const latest = populated[populated.length - 1] ?? null;

  const overview: RecordingQualityTrendOverview = {
    weeks_covered: weeks,
    populated_weeks: populated.length,
    current_avg: latest?.avg_overall ?? 0,
    overall_trend: overallTrend.dir,
    overall_change: overallTrend.change,
    childvoice_current: latest?.child_voice ?? 0,
    childvoice_trend: voiceTrend.dir,
    childvoice_change: voiceTrend.change,
  };

  return { overview, series, alerts: buildAlerts(overview), insights: buildInsights(overview) };
}

// ── Alerts & insights ──────────────────────────────────────────────────────────

function buildAlerts(o: RecordingQualityTrendOverview): TrendAlert[] {
  const alerts: TrendAlert[] = [];
  if (o.overall_trend === "declining") {
    alerts.push({ severity: "high", message: `Recording quality is declining (${o.overall_change} over the period) — review what changed and reinforce expectations` });
  }
  if (o.childvoice_trend === "declining") {
    alerts.push({ severity: "medium", message: `The child's voice in records is declining (${o.childvoice_change}) — re-emphasise capturing what children say and want` });
  }
  return alerts;
}

function buildInsights(o: RecordingQualityTrendOverview): AriaTrendInsight[] {
  const insights: AriaTrendInsight[] = [];
  if (o.populated_weeks < 2) {
    insights.push({ severity: "warning", text: "Not enough history yet to show a recording-quality trend — keep recording and a trajectory will build over the coming weeks." });
    return insights;
  }

  if (o.childvoice_trend === "improving") {
    insights.push({
      severity: "positive",
      text: `The child's voice in records is improving (+${o.childvoice_change} over the period, now ${o.childvoice_current}/100). Coaching is landing — name the change in supervision so staff know it is working and keep it up.`,
    });
  } else if (o.childvoice_current < 65) {
    insights.push({
      severity: "warning",
      text: `The child's voice has stayed weak (${o.childvoice_current}/100, ${o.childvoice_trend}) — it is a persistent gap, not a blip. A targeted, modelled coaching session is more likely to shift it than general reminders.`,
    });
  }

  if (o.overall_trend === "improving") {
    insights.push({ severity: "positive", text: `Overall recording quality is on an improving trajectory (+${o.overall_change}, now ${o.current_avg}/100). Evidence of an improving culture for inspection — capture before/after examples.` });
  } else if (o.overall_trend === "stable" && o.current_avg >= 80) {
    insights.push({ severity: "positive", text: `Recording quality is holding steady and high (${o.current_avg}/100). Consistency is itself a strength — keep quality-assuring a sample each week.` });
  }
  return insights;
}
