"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME SHIFT PATTERN INTELLIGENCE CARD
// Staffing patterns: coverage, punctuality, overtime, workload fairness.
// CHR 2015 Reg 33(4)(c). SCCIF: "Staffing arrangements."
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IntelligenceCardEmpty } from "@/components/dashboard/intelligence-card-empty";
import {
  Loader2, AlertCircle, AlertTriangle,
  Sparkles, Brain, CalendarClock,
  Clock, Users, Timer, ArrowLeftRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHomeShiftPatternIntelligence } from "@/hooks/use-home-shift-pattern-intelligence";
import type { ShiftPatternRating } from "@/lib/engines/home-shift-pattern-intelligence-engine";

// ── Style Maps ──────────────────────────────────────────────────────────────

const RATING_STYLES: Record<ShiftPatternRating, { bg: string; text: string; border: string; label: string }> = {
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

export function HomeShiftPatternIntelligenceCard() {
  const { data, isLoading } = useHomeShiftPatternIntelligence();

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
  const __emptyState = d.shift_rating === "inadequate" && (d.shift_score ?? 0) <= 15;
  if (__emptyState) {
    d = {
      ...d,
      shift_rating: "insufficient_data",
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

  const ratingStyle = RATING_STYLES[d.shift_rating] ?? RATING_STYLES.insufficient_data;
  const isAlert = d.shift_rating === "inadequate" || d.coverage.open_shifts > 0;

  return (
    <Card className={cn("overflow-hidden", isAlert ? "border-red-400 border-2" : "border-slate-200")}>
      <CardHeader className={cn("pb-3", isAlert ? "bg-red-50" : "bg-slate-50/50")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <CalendarClock className={cn("h-4 w-4", isAlert ? "text-red-600" : "text-indigo-500")} />
            <span className="text-slate-900">Shift Patterns</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
              {ratingStyle.label}
            </span>
            {d.shift_rating !== "insufficient_data" && (
              <span className="text-xs font-bold tabular-nums text-slate-600">{d.shift_score}%</span>
            )}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {d.shift_rating === "insufficient_data" && <IntelligenceCardEmpty />}

        {/* KPI Row */}
        {d.shift_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Open Shifts */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Users className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.coverage.open_shifts === 0 ? "text-green-600" : "text-red-600"
                )}>
                  {d.coverage.open_shifts}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Open Shifts</p>
            </div>

            {/* Punctuality */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.punctuality.on_time_rate >= 90 ? "text-green-600" :
                  d.punctuality.on_time_rate >= 75 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.punctuality.shifts_with_actual_start > 0 ? `${d.punctuality.on_time_rate}%` : "—"}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">On Time</p>
            </div>

            {/* Overtime */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Timer className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.overtime.total_overtime_minutes <= 30 ? "text-green-600" :
                  d.overtime.total_overtime_minutes <= 120 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.overtime.total_overtime_minutes}m
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Overtime</p>
            </div>

            {/* Swaps */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <ArrowLeftRight className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.swaps.pending_swaps === 0 ? "text-green-600" : "text-amber-600"
                )}>
                  {d.swaps.pending_swaps}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Pending Swaps</p>
            </div>
          </div>
        )}

        {/* Detail Panels */}
        {d.shift_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 gap-1.5">
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Coverage</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Total shifts: <span className="font-medium text-slate-600">{d.coverage.total_shifts}</span></p>
                <p>Day / Sleep-in: <span className="font-medium text-slate-600">{d.coverage.day_shifts}/{d.coverage.sleep_in_shifts}</span></p>
                <p>Staff rostered: <span className={cn("font-medium",
                  d.coverage.unique_staff_working >= 6 ? "text-green-600" : "text-amber-600"
                )}>{d.coverage.unique_staff_working}</span></p>
                <p>Completed: <span className="font-medium text-slate-600">{d.coverage.completed_shifts}</span></p>
              </div>
            </div>
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Punctuality</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Avg delay: <span className={cn("font-medium",
                  d.punctuality.avg_delay_minutes <= 5 ? "text-green-600" :
                  d.punctuality.avg_delay_minutes <= 15 ? "text-amber-600" : "text-red-600"
                )}>{d.punctuality.avg_delay_minutes}m</span></p>
                <p>Late starts: <span className={cn("font-medium",
                  d.punctuality.late_count === 0 ? "text-green-600" : "text-amber-600"
                )}>{d.punctuality.late_count}</span></p>
                <p>Fairness: <span className={cn("font-medium",
                  d.workload.fairness_ratio >= 0.6 ? "text-green-600" :
                  d.workload.fairness_ratio >= 0.4 ? "text-amber-600" : "text-red-600"
                )}>{d.workload.fairness_ratio}</span></p>
                <p>Max delay: <span className="font-medium text-slate-600">{d.punctuality.max_delay_minutes}m</span></p>
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

        {/* Cara Shift Intelligence */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Shift Intelligence
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
