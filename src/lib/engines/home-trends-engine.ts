import { todayStr } from "@/lib/utils";
// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME TRENDS / "DIRECTION OF TRAVEL" ENGINE
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
//
// The platform is rich in point-in-time intelligence but answers the RM's most-
// asked question — "are things getting better or worse?" — nowhere. This engine
// composes the home's key safety & wellbeing signals (incidents, physical
// interventions, concerning behaviour, sanctions, rewards, missing episodes) over
// TIME, bucketing each into weekly windows and classifying its direction of travel
// with the correct polarity: for safety/concern metrics FEWER is improving; for
// rewards MORE is improving.
//
// Reuses the proven weekly-bucketing technique from recording-quality-trend-engine.
// Regulatory: CHR 2015 Reg 13 (leaders driving improvement), SCCIF — leaders know
// whether outcomes are improving and act on the trajectory.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input ─────────────────────────────────────────────────────────────────────

export type TrendPolarity = "lower_better" | "higher_better";

export interface TrendMetricInput {
  key: string;
  label: string;
  unit: string;              // plural noun for headlines, e.g. "incidents", "rewards"
  polarity: TrendPolarity;
  dates: string[];           // ISO YYYY-MM-DD, one per event
  description?: string;
}

export interface HomeTrendsInput {
  metrics: TrendMetricInput[];
  weeks?: number;            // weekly buckets back (default 8)
  today?: string;            // ISO date — injectable for deterministic tests
}

// ── Output ────────────────────────────────────────────────────────────────────

export type TrendDirection = "improving" | "worsening" | "stable" | "insufficient_data";
export type TrendStatus = "good" | "concern" | "neutral";

export interface TrendWeekPoint {
  week_start: string;        // ISO date (start of the 7-day window)
  label: string;             // e.g. "w/c 2026-05-12"
  count: number;
}

export interface TrendMetricResult {
  key: string;
  label: string;
  description?: string;
  unit: string;
  polarity: TrendPolarity;
  series: TrendWeekPoint[];  // chronological, oldest week first
  sparkline: number[];       // counts oldest → newest (for compact rendering)
  total: number;             // events across the whole window
  recent_4w: number;         // sum of the most recent 4 weeks
  prior_4w: number;          // sum of the 4 weeks before that
  current_week: number;      // most recent week's count
  direction: TrendDirection;
  change: number;            // recent_4w − prior_4w (raw event delta)
  pct_change: number;        // % vs prior_4w (signed; 0 when prior is 0)
  status: TrendStatus;       // direction interpreted for RAG colour
  headline: string;
}

export interface HomeTrendsOverview {
  weeks_covered: number;
  metrics_count: number;
  improving: number;
  worsening: number;
  stable: number;
  overall_direction: TrendDirection | "mixed";
  headline: string;
}

export interface HomeTrendInsight {
  severity: "critical" | "warning" | "positive" | "info";
  text: string;
}

export interface HomeTrendsResult {
  overview: HomeTrendsOverview;
  metrics: TrendMetricResult[];
  insights: HomeTrendInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function daysAgo(date: string, today: string): number {
  return Math.floor((new Date(today).getTime() - new Date(date).getTime()) / 86_400_000);
}
function addDays(date: string, n: number): string {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
function sum(arr: number[]): number { return arr.reduce((s, v) => s + v, 0); }

/**
 * Classify direction of travel from recent-4-weeks vs prior-4-weeks counts.
 * Significant only when the change is BOTH material in absolute (≥2 events) and
 * relative (≥25%) terms — this filters week-to-week noise across metrics whose
 * volumes differ by an order of magnitude. Polarity decides whether a rise is good.
 */
function classifyDirection(
  prior: number,
  recent: number,
  windowTotal: number,
  polarity: TrendPolarity,
): TrendDirection {
  if (windowTotal === 0) return "insufficient_data";
  const change = recent - prior;
  const absChange = Math.abs(change);
  const pct = prior > 0 ? (change / prior) * 100 : recent > 0 ? 100 : 0;
  const significant = absChange >= 2 && Math.abs(pct) >= 25;
  if (!significant) return "stable";
  const increasing = change > 0;
  if (polarity === "lower_better") return increasing ? "worsening" : "improving";
  return increasing ? "improving" : "worsening";
}

function statusOf(direction: TrendDirection): TrendStatus {
  if (direction === "improving") return "good";
  if (direction === "worsening") return "concern";
  return "neutral";
}

function pctChange(prior: number, recent: number): number {
  if (prior === 0) return recent > 0 ? 100 : 0;
  return Math.round(((recent - prior) / prior) * 100);
}

function metricHeadline(
  label: string,
  unit: string,
  polarity: TrendPolarity,
  direction: TrendDirection,
  prior: number,
  recent: number,
  pct: number,
): string {
  const absPct = Math.abs(pct);
  const moved = recent === prior ? "level" : recent > prior ? "up" : "down";
  switch (direction) {
    case "improving":
      return `${label} ${moved} ${absPct}% vs the previous 4 weeks (${prior}→${recent} ${unit}) — improving`;
    case "worsening":
      return `${label} ${moved} ${absPct}% vs the previous 4 weeks (${prior}→${recent} ${unit}) — needs attention`;
    case "stable":
      return `${label} holding steady (${prior}→${recent} ${unit} over the last 4-week windows)`;
    default:
      return `Not enough ${unit} recorded in the period to show a ${label.toLowerCase()} trend`;
  }
}

// ── Main computation ──────────────────────────────────────────────────────────

export function computeHomeTrends(input: HomeTrendsInput): HomeTrendsResult {
  const today = input.today ?? todayStr();
  const weeks = input.weeks ?? 8;

  const metrics: TrendMetricResult[] = input.metrics.map((m) => {
    // Bucket dates into weekly windows. Bucket i covers [i*7, (i+1)*7) days ago.
    const buckets = Array.from({ length: weeks }, () => 0);
    for (const raw of m.dates) {
      if (!raw) continue;
      const d = daysAgo(raw, today);
      if (d < 0) continue;
      const i = Math.floor(d / 7);
      if (i < weeks) buckets[i] += 1;
    }

    // Chronological series (oldest week first).
    const series: TrendWeekPoint[] = [];
    for (let i = weeks - 1; i >= 0; i--) {
      const weekStart = addDays(today, -((i + 1) * 7 - 1));
      series.push({ week_start: weekStart, label: `w/c ${weekStart}`, count: buckets[i] });
    }
    const sparkline = series.map((p) => p.count);

    // Recent 4 weeks vs prior 4 weeks (buckets 0..3 are most recent).
    const recent_4w = sum(buckets.slice(0, Math.min(4, weeks)));
    const prior_4w = sum(buckets.slice(Math.min(4, weeks), Math.min(8, weeks)));
    const total = sum(buckets);
    const direction = classifyDirection(prior_4w, recent_4w, total, m.polarity);
    const pct = pctChange(prior_4w, recent_4w);

    return {
      key: m.key,
      label: m.label,
      description: m.description,
      unit: m.unit,
      polarity: m.polarity,
      series,
      sparkline,
      total,
      recent_4w,
      prior_4w,
      current_week: buckets[0],
      direction,
      change: recent_4w - prior_4w,
      pct_change: pct,
      status: statusOf(direction),
      headline: metricHeadline(m.label, m.unit, m.polarity, direction, prior_4w, recent_4w, pct),
    };
  });

  const improving = metrics.filter((m) => m.direction === "improving").length;
  const worsening = metrics.filter((m) => m.direction === "worsening").length;
  const stable = metrics.filter((m) => m.direction === "stable").length;
  const anyData = metrics.some((m) => m.direction !== "insufficient_data");

  let overall: HomeTrendsOverview["overall_direction"];
  if (!anyData) overall = "insufficient_data";
  else if (worsening > improving) overall = "worsening";
  else if (improving > worsening) overall = "improving";
  else if (improving > 0) overall = "mixed";
  else overall = "stable";

  const overview: HomeTrendsOverview = {
    weeks_covered: weeks,
    metrics_count: metrics.length,
    improving,
    worsening,
    stable,
    overall_direction: overall,
    headline: overviewHeadline(overall, improving, worsening),
  };

  return { overview, metrics, insights: buildInsights(overview, metrics) };
}

function overviewHeadline(
  overall: HomeTrendsOverview["overall_direction"],
  improving: number,
  worsening: number,
): string {
  switch (overall) {
    case "improving":
      return `Direction of travel is positive — ${improving} signal${improving === 1 ? "" : "s"} improving and outpacing the ${worsening} worsening.`;
    case "worsening":
      return `Direction of travel needs attention — ${worsening} signal${worsening === 1 ? "" : "s"} worsening against ${improving} improving.`;
    case "mixed":
      return `A mixed picture — ${improving} signal${improving === 1 ? "" : "s"} improving and ${worsening} worsening. Hold the gains, target the regressions.`;
    case "stable":
      return "Signals are holding steady — no material movement up or down across the period.";
    default:
      return "Not enough recorded activity in the period to show a direction of travel yet.";
  }
}

function buildInsights(overview: HomeTrendsOverview, metrics: TrendMetricResult[]): HomeTrendInsight[] {
  const insights: HomeTrendInsight[] = [];

  // Worsening safety/concern signals — most important to surface, ranked by % move.
  const worseningConcern = metrics
    .filter((m) => m.direction === "worsening" && m.polarity === "lower_better")
    .sort((a, b) => Math.abs(b.pct_change) - Math.abs(a.pct_change));
  for (const m of worseningConcern) {
    insights.push({
      severity: Math.abs(m.pct_change) >= 50 ? "critical" : "warning",
      text: `${m.label} have risen ${Math.abs(m.pct_change)}% (${m.prior_4w}→${m.recent_4w}) over the last two 4-week windows. Review what changed — staffing, a specific child, a setting — and put a targeted response in place before it embeds.`,
    });
  }

  // A worsening reward trend means recognition is dropping off.
  for (const m of metrics.filter((m) => m.direction === "worsening" && m.polarity === "higher_better")) {
    insights.push({
      severity: "warning",
      text: `${m.label} have fallen ${Math.abs(m.pct_change)}% (${m.prior_4w}→${m.recent_4w}). Positive recognition is dropping off — reinforce catching and recording what is going well, not only what goes wrong.`,
    });
  }

  // Improving signals — evidence of impact for inspection; name them so staff know it's working.
  const improving = metrics.filter((m) => m.direction === "improving");
  for (const m of improving) {
    const verb = m.polarity === "lower_better" ? "fallen" : "risen";
    insights.push({
      severity: "positive",
      text: `${m.label} have ${verb} ${Math.abs(m.pct_change)}% (${m.prior_4w}→${m.recent_4w}) — a genuine improving trajectory. Capture what drove it and name it in supervision so the practice is recognised and sustained.`,
    });
  }

  if (overview.overall_direction === "insufficient_data") {
    insights.push({
      severity: "info",
      text: "Keep recording — a few more weeks of activity will build a trajectory the dashboard can read.",
    });
  } else if (improving.length === 0 && overview.worsening === 0) {
    insights.push({
      severity: "info",
      text: "Signals are steady. Steady is not the same as good — cross-check the point-in-time ratings to confirm the level itself is where it should be.",
    });
  }

  return insights;
}
