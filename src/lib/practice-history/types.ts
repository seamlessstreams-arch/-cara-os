// ═══════════════════════════════════════════════════════════════════════════
// CARA — PRACTICE ANALYSIS HISTORY  ·  types
//
// Lightweight, METADATA-ONLY history of practice analyses (PACE quality and
// Writing-to-the-Child child-readability) so leaders can see whether recording
// is improving over time. No record content is ever stored — only scores, flag
// counts and timestamps. Cara advises; managers decide.
// ═══════════════════════════════════════════════════════════════════════════

/** One PACE analysis, summarised (no record content). */
export interface PaceAnalysisRecord {
  id: string;
  at: string;
  home_id: string;
  child_id: string | null;
  staff_id: string | null;
  context: string;
  score: number; // 0–100 PACE quality
  band: string;
  flag_count: number;
  manager_review_required: boolean;
}

/** One Writing-to-the-Child review, summarised (no record content). */
export interface WritingReviewRecord {
  id: string;
  at: string;
  home_id: string;
  staff_id: string | null;
  record_type: string;
  overall_score: number; // 0–100 child-readability
  flag_count: number;
}

export type TrendDirection = "improving" | "worsening" | "stable" | "insufficient_data";

export interface TrendWeekPoint {
  /** Weeks ago (0 = current week). */
  weeksAgo: number;
  avgScore: number | null;
  count: number;
}

export interface TrendSeries {
  /** Chronological, oldest week first. */
  series: TrendWeekPoint[];
  /** Average scores oldest → newest (nulls as 0) for compact bar rendering. */
  sparkline: number[];
  total: number;
  recent4wAvg: number | null;
  prior4wAvg: number | null;
  direction: TrendDirection;
  headline: string;
}

export interface PracticeTrendsResult {
  /** Window length in weeks. */
  weeks: number;
  pace: TrendSeries;
  writing: TrendSeries;
}
