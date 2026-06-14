// ═══════════════════════════════════════════════════════════════════════════
// CARA — PRACTICE ANALYSIS TRENDS  ·  engine (pure / deterministic)
//
// Buckets metadata-only analysis history into weekly windows and reports
// whether recording quality (PACE stance + child-readability) is improving.
// `today` is injected; no clock/store access here.
// ═══════════════════════════════════════════════════════════════════════════

import type {
  PaceAnalysisRecord,
  WritingReviewRecord,
  TrendSeries,
  TrendWeekPoint,
  TrendDirection,
  PracticeTrendsResult,
} from "./types";

const DAY = 864e5;

function daysAgo(at: string, today: string): number {
  const t = Date.parse(at), n = Date.parse(today);
  if (!Number.isFinite(t) || !Number.isFinite(n)) return Number.POSITIVE_INFINITY;
  return Math.floor((n - t) / DAY);
}

function round(n: number): number { return Math.round(n); }

/** Bucket dated, scored records into `weeks` weekly windows and derive a trend. */
export function buildTrendSeries(
  rows: { at: string; score: number }[],
  today: string,
  weeks: number,
  label: string,
): TrendSeries {
  // sums[i] / counts[i] where i = weeks ago (0 = current week)
  const sums = Array.from({ length: weeks }, () => 0);
  const counts = Array.from({ length: weeks }, () => 0);
  let total = 0;
  for (const r of rows) {
    const d = daysAgo(r.at, today);
    if (d < 0) continue;
    const i = Math.floor(d / 7);
    if (i < weeks) { sums[i] += r.score; counts[i] += 1; total += 1; }
  }

  // Chronological series (oldest week first).
  const series: TrendWeekPoint[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    series.push({ weeksAgo: i, avgScore: counts[i] ? round(sums[i] / counts[i]) : null, count: counts[i] });
  }
  const sparkline = series.map((p) => p.avgScore ?? 0);

  const avgOver = (from: number, to: number): number | null => {
    let s = 0, c = 0;
    for (let i = from; i < to && i < weeks; i++) { s += sums[i]; c += counts[i]; }
    return c ? round(s / c) : null;
  };
  const recent4wAvg = avgOver(0, 4);
  const prior4wAvg = avgOver(4, 8);

  let direction: TrendDirection = "insufficient_data";
  let headline: string;
  if (total < 3 || recent4wAvg == null) {
    direction = "insufficient_data";
    headline = `Not enough ${label} analyses yet to show a trend (${total} recorded).`;
  } else if (prior4wAvg == null) {
    direction = "stable";
    headline = `${label}: ${recent4wAvg}/100 average over the last 4 weeks (${total} analyses).`;
  } else {
    const delta = recent4wAvg - prior4wAvg;
    direction = delta >= 4 ? "improving" : delta <= -4 ? "worsening" : "stable";
    const word = direction === "improving" ? "up" : direction === "worsening" ? "down" : "steady";
    headline = `${label}: ${recent4wAvg}/100 in the last 4 weeks (${word} from ${prior4wAvg}; ${total} analyses).`;
  }
  return { series, sparkline, total, recent4wAvg, prior4wAvg, direction, headline };
}

export interface PracticeTrendsInput {
  paceAnalyses: PaceAnalysisRecord[];
  writingReviews: WritingReviewRecord[];
  today: string;
  weeks?: number;
}

export function summarisePracticeTrends(input: PracticeTrendsInput): PracticeTrendsResult {
  const weeks = input.weeks ?? 8;
  return {
    weeks,
    pace: buildTrendSeries(
      input.paceAnalyses.map((r) => ({ at: r.at, score: r.score })),
      input.today, weeks, "PACE quality",
    ),
    writing: buildTrendSeries(
      input.writingReviews.map((r) => ({ at: r.at, score: r.overall_score })),
      input.today, weeks, "Child-readable recording",
    ),
  };
}
