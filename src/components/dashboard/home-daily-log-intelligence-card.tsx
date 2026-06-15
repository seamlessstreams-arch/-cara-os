"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME DAILY LOG INTELLIGENCE CARD
// Recording patterns, mood tracking, entry types, staff participation.
// CHR 2015 Reg 36: "Records — maintain comprehensive records."
// SCCIF: "Records are clear, up to date, and stored safely."
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IntelligenceCardEmpty } from "@/components/dashboard/intelligence-card-empty";
import {
  Loader2, AlertCircle, AlertTriangle,
  Sparkles, Brain, BookOpen,
  Users, SmilePlus, CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHomeDailyLogIntelligence } from "@/hooks/use-home-daily-log-intelligence";
import type { DailyLogRating } from "@/lib/engines/home-daily-log-intelligence-engine";

// ── Style Maps ──────────────────────────────────────────────────────────────

const RATING_STYLES: Record<DailyLogRating, { bg: string; text: string; border: string; label: string }> = {
  outstanding:       { bg: "bg-green-100",  text: "text-green-800",  border: "border-green-300",  label: "OUTSTANDING" },
  good:              { bg: "bg-blue-100",   text: "text-blue-800",   border: "border-blue-300",   label: "GOOD" },
  adequate:          { bg: "bg-amber-100",  text: "text-amber-800",  border: "border-amber-300",  label: "ADEQUATE" },
  inadequate:        { bg: "bg-red-100",    text: "text-red-800",    border: "border-red-300",    label: "INADEQUATE" },
  insufficient_data: { bg: "bg-slate-100",  text: "text-slate-800",  border: "border-slate-300",  label: "NO DATA" },
};

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  positive: "border-green-200 bg-green-50 text-green-800",
};

const REC_STYLES: Record<string, string> = {
  immediate: "border-red-200 bg-red-50 text-red-800",
  soon: "border-amber-200 bg-amber-50 text-amber-800",
  planned: "border-blue-200 bg-blue-50 text-blue-800",
};

// ── Component ───────────────────────────────────────────────────────────────

export function HomeDailyLogIntelligenceCard() {
  const { data, isLoading } = useHomeDailyLogIntelligence();

  if (isLoading) {
    return (
      <Card className="overflow-hidden border-slate-200">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  let d = data?.data;
  if (!d) return null;
  // Calm reframe: an empty-with-children engine result (inadequate + score<=15) is
  // 'not yet recorded', not a failing home — render it as honest, neutral insufficient_data.
  const __emptyState = d.log_rating === "inadequate" && (d.log_score ?? 0) <= 15;
  if (__emptyState) {
    d = {
      ...d,
      log_rating: "insufficient_data",
      concerns: [],
      recommendations: [],
      insights: [],
      headline:
        String(d.headline || "")
          .split(/ despite | — | -- /)[0]
          .replace(/[\u2014,\-]\s*$/, "")
          .trim() + " — not yet recorded; capturing entries will enable this analysis.",
    };
  }

  const ratingStyle = RATING_STYLES[d.log_rating] ?? RATING_STYLES.insufficient_data;
  const isAlert = d.log_rating === "inadequate" || d.frequency.days_with_no_entries >= 7;

  return (
    <Card className={cn("overflow-hidden", isAlert ? "border-red-400 border-2" : "border-slate-200")}>
      <CardHeader className={cn("pb-3", isAlert ? "bg-red-50" : "bg-slate-50/50")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <BookOpen className={cn("h-4 w-4", isAlert ? "text-red-600" : "text-cyan-500")} />
            <span className="text-slate-900">Daily Log Quality</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
              {ratingStyle.label}
            </span>
            {d.log_rating !== "insufficient_data" && (
              <span className="text-xs font-bold tabular-nums text-slate-600">{d.log_score}%</span>
            )}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {d.log_rating === "insufficient_data" && <IntelligenceCardEmpty />}

        {/* KPI Row */}
        {d.log_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Entries (14d) */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.frequency.total_entries_14d >= 30 ? "text-green-600" :
                  d.frequency.total_entries_14d >= 15 ? "text-blue-600" : "text-red-600"
                )}>
                  {d.frequency.total_entries_14d}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Entries (14d)</p>
            </div>

            {/* Days Active */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.frequency.days_with_entries_14d >= 12 ? "text-green-600" :
                  d.frequency.days_with_entries_14d >= 8 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.frequency.days_with_entries_14d}/14
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Days Active</p>
            </div>

            {/* Avg Mood */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <SmilePlus className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.mood.avg_mood_score >= 7 ? "text-green-600" :
                  d.mood.avg_mood_score >= 5 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.mood.avg_mood_score || "—"}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Avg Mood</p>
            </div>

            {/* Staff Contributing */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Users className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.staff.staff_participation_rate >= 70 ? "text-green-600" :
                  d.staff.staff_participation_rate >= 40 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.staff.unique_staff_14d}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Staff</p>
            </div>
          </div>
        )}

        {/* Detail Panels */}
        {d.log_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 gap-1.5">
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Recording</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Per child/day: <span className="font-medium text-slate-600">{d.frequency.entries_per_child_per_day_avg}</span></p>
                <p>Types used: <span className="font-medium text-slate-600">{d.entry_types.types_used.length}/{d.entry_types.types_used.length + d.entry_types.types_missing.length}</span></p>
                <p>Mood tracked: <span className={cn("font-medium",
                  d.mood.mood_tracking_rate >= 80 ? "text-green-600" : "text-amber-600"
                )}>{d.mood.mood_tracking_rate}%</span></p>
                <p>Significant: <span className="font-medium text-slate-600">{d.quality.significant_entries}</span></p>
              </div>
            </div>
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Coverage</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Children: <span className={cn("font-medium",
                  d.child_coverage.child_coverage_rate >= 100 ? "text-green-600" : "text-amber-600"
                )}>{d.child_coverage.children_with_entries_14d}/{d.child_coverage.children_with_entries_14d + d.child_coverage.children_without}</span></p>
                <p>Low mood: <span className={cn("font-medium",
                  d.mood.low_mood_count === 0 ? "text-green-600" :
                  d.mood.low_mood_count <= 3 ? "text-amber-600" : "text-red-600"
                )}>{d.mood.low_mood_count}</span></p>
                <p>High mood: <span className="font-medium text-green-600">{d.mood.high_mood_count}</span></p>
                <p>Avg length: <span className="font-medium text-slate-600">{d.quality.avg_content_length}</span></p>
              </div>
            </div>
          </div>
        )}

        {/* Strengths */}
        {d.strengths.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-green-700 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Strengths ({d.strengths.length})
            </p>
            {d.strengths.slice(0, 3).map((s, i) => (
              <div key={i} className="rounded border border-green-200 bg-green-50 p-2.5 text-xs text-green-800 leading-relaxed">
                {s}
              </div>
            ))}
          </div>
        )}

        {/* Concerns */}
        {d.concerns.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-red-700 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Concerns ({d.concerns.length})
            </p>
            {d.concerns.slice(0, 3).map((c, i) => (
              <div key={i} className="rounded border border-red-200 bg-red-50 p-2.5 text-xs text-red-800 leading-relaxed">
                {c}
              </div>
            ))}
          </div>
        )}

        {/* Recommendations */}
        {d.recommendations.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-amber-600" />
              Recommendations ({d.recommendations.length})
            </p>
            {d.recommendations.slice(0, 3).map((rec) => (
              <div key={rec.rank} className={cn("rounded border p-2.5 text-xs leading-relaxed", REC_STYLES[rec.urgency] ?? REC_STYLES.planned)}>
                <div className="flex items-start justify-between gap-2">
                  <span>{rec.recommendation}</span>
                  {rec.regulatory_ref && (
                    <span className="text-[10px] font-mono shrink-0 opacity-60">{rec.regulatory_ref}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cara Daily Log Intelligence */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Daily Log Intelligence
            </p>
            {d.insights.slice(0, 3).map((insight, i) => (
              <div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", INSIGHT_STYLES[insight.severity] ?? INSIGHT_STYLES.warning)}>
                {insight.text}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
