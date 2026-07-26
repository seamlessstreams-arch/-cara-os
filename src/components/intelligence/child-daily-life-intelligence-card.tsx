"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILD DAILY LIFE INTELLIGENCE CARD
// Per-child: daily log analysis — mood patterns, recording frequency,
// entry type coverage, significant events, time-of-day coverage.
// CHR 2015 Reg 10, 6, 36. SCCIF: "Quality of care."
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle, Brain, Loader2, AlertCircle,
  Sparkles, BookOpen, Smile, Calendar,
  TrendingUp, TrendingDown, Minus, BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import type { DailyLifeRating, ChildDailyLifeResult } from "@/lib/engines/child-daily-life-intelligence-engine";

// ── Data (inlined from the former use-child-daily-life-intelligence hook) ───

interface ChildDailyLifeResponse {
  data: ChildDailyLifeResult;
}

function useChildDailyLifeIntelligence(childId: string) {
  return useQuery<ChildDailyLifeResponse>({
    queryKey: ["child-daily-life-intelligence", childId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/child-daily-life-intelligence?childId=${childId}`);
      if (!res.ok) throw new Error("Failed to fetch child daily life intelligence");
      return res.json();
    },
    enabled: !!childId,
    refetchInterval: 60_000,
  });
}

// ── Style Maps ──────────────────────────────────────────────────────────────

const RATING_STYLES: Record<DailyLifeRating, { bg: string; text: string; border: string; label: string }> = {
  outstanding:   { bg: "bg-green-100",  text: "text-green-800",  border: "border-green-300",  label: "OUTSTANDING" },
  good:          { bg: "bg-blue-100",   text: "text-blue-800",   border: "border-blue-300",   label: "GOOD" },
  adequate:      { bg: "bg-amber-100",  text: "text-amber-800",  border: "border-amber-300",  label: "ADEQUATE" },
  inadequate:    { bg: "bg-red-100",    text: "text-red-800",    border: "border-red-300",    label: "INADEQUATE" },
  no_entries:    { bg: "bg-slate-100",  text: "text-slate-800",  border: "border-slate-300",  label: "NO ENTRIES" },
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

const MOOD_TREND_ICON = {
  improving: TrendingUp,
  stable: Minus,
  declining: TrendingDown,
  insufficient_data: Minus,
};

const MOOD_TREND_COLOR: Record<string, string> = {
  improving: "text-green-600",
  stable: "text-slate-500",
  declining: "text-red-600",
  insufficient_data: "text-slate-400",
};

// ── Component ───────────────────────────────────────────────────────────────

export function ChildDailyLifeIntelligenceCard({ childId }: { childId: string }) {
  const { data, isLoading } = useChildDailyLifeIntelligence(childId);

  if (isLoading) {
    return (
      <Card className="overflow-hidden border-slate-200">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const d = data?.data;
  if (!d) return null;

  const ratingStyle = RATING_STYLES[d.daily_life_rating] ?? RATING_STYLES.no_entries;
  const MoodTrendIcon = MOOD_TREND_ICON[d.mood_profile.mood_trend];
  const noRecentEntries = d.recording_frequency.entries_7d === 0 && d.recording_frequency.total_entries > 0;

  return (
    <Card className={cn("overflow-hidden", noRecentEntries ? "border-amber-400 border-2" : "border-slate-200")}>
      <CardHeader className={cn("pb-3", noRecentEntries ? "bg-amber-50" : "bg-slate-50/50")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <BookOpen className={cn("h-4 w-4", noRecentEntries ? "text-amber-600" : "text-sky-500")} />
            <span className="text-slate-900">Daily Life</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
              {ratingStyle.label}
            </span>
            {d.daily_life_rating !== "no_entries" && (
              <span className="text-xs font-bold tabular-nums text-slate-600">{d.daily_life_score}%</span>
            )}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* KPI Row */}
        {d.recording_frequency.total_entries > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums", d.recording_frequency.recording_coverage_rate >= 90 ? "text-green-600" : d.recording_frequency.recording_coverage_rate >= 70 ? "text-amber-600" : "text-red-600")}>
                  {d.recording_frequency.recording_coverage_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Coverage</p>
            </div>
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Smile className={cn("h-3.5 w-3.5", d.mood_profile.avg_mood_7d !== null && d.mood_profile.avg_mood_7d >= 7 ? "text-green-500" : d.mood_profile.avg_mood_7d !== null && d.mood_profile.avg_mood_7d >= 5 ? "text-amber-500" : "text-red-500")} />
                <p className={cn("text-lg font-bold tabular-nums", d.mood_profile.avg_mood_7d !== null && d.mood_profile.avg_mood_7d >= 7 ? "text-green-600" : d.mood_profile.avg_mood_7d !== null && d.mood_profile.avg_mood_7d >= 5 ? "text-amber-600" : "text-red-600")}>
                  {d.mood_profile.avg_mood_7d !== null ? d.mood_profile.avg_mood_7d : "—"}
                </p>
                {d.mood_profile.mood_trend !== "insufficient_data" && (
                  <MoodTrendIcon className={cn("h-3 w-3", MOOD_TREND_COLOR[d.mood_profile.mood_trend])} />
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">Mood (7d)</p>
            </div>
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <p className={cn("text-lg font-bold tabular-nums", d.recording_frequency.entries_30d >= 30 ? "text-green-600" : d.recording_frequency.entries_30d >= 15 ? "text-amber-600" : "text-red-600")}>
                {d.recording_frequency.entries_30d}
              </p>
              <p className="text-[10px] text-muted-foreground">Entries (30d)</p>
            </div>
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <BarChart3 className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums", d.quality.type_variety >= 6 ? "text-green-600" : d.quality.type_variety >= 4 ? "text-amber-600" : "text-red-600")}>
                  {d.quality.type_variety}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Entry Types</p>
            </div>
          </div>
        )}

        {/* Detail Panels */}
        {d.recording_frequency.total_entries > 0 && (
          <div className="grid grid-cols-2 gap-1.5">
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Mood Profile</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>7d avg: <span className="font-medium text-slate-600">{d.mood_profile.avg_mood_7d ?? "—"}/10</span></p>
                <p>30d avg: <span className="font-medium text-slate-600">{d.mood_profile.avg_mood_30d ?? "—"}/10</span></p>
                {d.mood_profile.lowest_mood_7d !== null && (
                  <p>7d range: <span className={cn("font-medium", d.mood_profile.lowest_mood_7d < 5 ? "text-red-600" : "text-slate-600")}>{d.mood_profile.lowest_mood_7d}–{d.mood_profile.highest_mood_7d}</span></p>
                )}
                {d.mood_profile.mood_below_5_count > 0 && (
                  <p className="text-amber-600 font-medium">{d.mood_profile.mood_below_5_count} low mood entries</p>
                )}
              </div>
            </div>
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Recording Quality</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Coverage: <span className={d.recording_frequency.recording_coverage_rate >= 90 ? "text-green-600 font-medium" : "text-amber-600 font-medium"}>{d.recording_frequency.recording_coverage_rate}%</span></p>
                <p>Staff recording: <span className="font-medium text-slate-600">{d.quality.staff_recording_count}</span></p>
                <p>Significant: <span className="font-medium text-slate-600">{d.quality.significant_events_30d}</span></p>
                <p>AM/PM/Eve: <span className="font-medium text-slate-600">{d.quality.morning_entries}/{d.quality.afternoon_entries}/{d.quality.evening_entries}</span></p>
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

        {/* Cara Daily Life Intelligence */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Daily Life Intelligence
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
