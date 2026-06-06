"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CHILD EMOTIONAL WELLBEING INTELLIGENCE CARD
// Per-child: synthesised mood trajectory, behaviour patterns, engagement,
// sanctions/rewards balance — holistic emotional health view.
// CHR 2015 Reg 7, 10. SCCIF: "Experiences and progress."
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IntelligenceCardEmpty } from "@/components/dashboard/intelligence-card-empty";
import {
  AlertTriangle, Brain, Loader2, AlertCircle,
  Sparkles, HeartPulse, Smile, Award,
  TrendingUp, TrendingDown, Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useChildEmotionalWellbeingIntelligence } from "@/hooks/use-child-emotional-wellbeing-intelligence";
import type { EmotionalWellbeingRating } from "@/lib/engines/child-emotional-wellbeing-intelligence-engine";

// ── Style Maps ──────────────────────────────────────────────────────────────

const RATING_STYLES: Record<EmotionalWellbeingRating, { bg: string; text: string; border: string; label: string }> = {
  outstanding:        { bg: "bg-green-100",  text: "text-green-800",  border: "border-green-300",  label: "OUTSTANDING" },
  good:               { bg: "bg-blue-100",   text: "text-blue-800",   border: "border-blue-300",   label: "GOOD" },
  adequate:           { bg: "bg-amber-100",  text: "text-amber-800",  border: "border-amber-300",  label: "ADEQUATE" },
  inadequate:         { bg: "bg-red-100",    text: "text-red-800",    border: "border-red-300",    label: "INADEQUATE" },
  insufficient_data:  { bg: "bg-slate-100",  text: "text-slate-800",  border: "border-slate-300",  label: "NO DATA" },
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

export function ChildEmotionalWellbeingIntelligenceCard({ childId }: { childId: string }) {
  const { data, isLoading } = useChildEmotionalWellbeingIntelligence(childId);

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

  const ratingStyle = RATING_STYLES[d.emotional_wellbeing_rating] ?? RATING_STYLES.insufficient_data;
  const MoodTrendIcon = MOOD_TREND_ICON[d.mood.mood_trend];
  const isLowMood = d.mood.avg_mood_30d !== null && d.mood.avg_mood_30d < 5;
  const isDeclining = d.mood.mood_trend === "declining";

  return (
    <Card className={cn("overflow-hidden", isLowMood || isDeclining ? "border-amber-400 border-2" : "border-slate-200")}>
      <CardHeader className={cn("pb-3", isLowMood ? "bg-amber-50" : "bg-slate-50/50")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <HeartPulse className={cn("h-4 w-4", isLowMood ? "text-amber-600" : "text-pink-500")} />
            <span className="text-slate-900">Emotional Wellbeing</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
              {ratingStyle.label}
            </span>
            {d.emotional_wellbeing_rating !== "insufficient_data" && (
              <span className="text-xs font-bold tabular-nums text-slate-600">{d.emotional_wellbeing_score}%</span>
            )}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {d.emotional_wellbeing_rating === "insufficient_data" && <IntelligenceCardEmpty />}

        {/* KPI Row */}
        {d.emotional_wellbeing_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Smile className={cn("h-3.5 w-3.5", d.mood.avg_mood_30d !== null && d.mood.avg_mood_30d >= 7 ? "text-green-500" : d.mood.avg_mood_30d !== null && d.mood.avg_mood_30d >= 5 ? "text-amber-500" : "text-red-500")} />
                <p className={cn("text-lg font-bold tabular-nums", d.mood.avg_mood_30d !== null && d.mood.avg_mood_30d >= 7 ? "text-green-600" : d.mood.avg_mood_30d !== null && d.mood.avg_mood_30d >= 5 ? "text-amber-600" : "text-red-600")}>
                  {d.mood.avg_mood_30d ?? "—"}
                </p>
                {d.mood.mood_trend !== "insufficient_data" && (
                  <MoodTrendIcon className={cn("h-3 w-3", MOOD_TREND_COLOR[d.mood.mood_trend])} />
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">Mood (30d)</p>
            </div>
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <p className={cn("text-lg font-bold tabular-nums", d.behaviour.positive_rate_30d >= 60 ? "text-green-600" : d.behaviour.positive_rate_30d >= 40 ? "text-amber-600" : "text-red-600")}>
                {d.behaviour.positive_rate_30d}%
              </p>
              <p className="text-[10px] text-muted-foreground">Positive Beh.</p>
            </div>
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Award className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums", d.reward_balance.balance_rating === "positive" ? "text-green-600" : d.reward_balance.balance_rating === "sanctions_heavy" ? "text-red-600" : "text-slate-600")}>
                  {d.reward_balance.reward_ratio}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Reward Ratio</p>
            </div>
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <p className={cn("text-lg font-bold tabular-nums", d.mood.low_mood_days === 0 ? "text-green-600" : d.mood.low_mood_days <= 2 ? "text-amber-600" : "text-red-600")}>
                {d.mood.low_mood_days}
              </p>
              <p className="text-[10px] text-muted-foreground">Low Mood Days</p>
            </div>
          </div>
        )}

        {/* Detail Panels */}
        {d.emotional_wellbeing_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 gap-1.5">
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Mood Profile</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>7d avg: <span className="font-medium text-slate-600">{d.mood.avg_mood_7d ?? "—"}/10</span></p>
                {d.mood.lowest_mood_30d !== null && (
                  <p>Range: <span className="font-medium text-slate-600">{d.mood.lowest_mood_30d}–{d.mood.highest_mood_30d}</span></p>
                )}
                {d.mood.mood_variability !== "insufficient_data" && (
                  <p>Variability: <span className={cn("font-medium", d.mood.mood_variability === "high" ? "text-red-600" : "text-slate-600")}>{d.mood.mood_variability}</span></p>
                )}
                {d.behaviour.severe_incidents_30d > 0 && (
                  <p className="text-red-600 font-medium">{d.behaviour.severe_incidents_30d} severe incidents</p>
                )}
              </div>
            </div>
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Engagement</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Keywork: <span className="font-medium text-slate-600">{d.engagement.keywork_sessions_30d} sessions</span></p>
                {d.engagement.keywork_voice_rate > 0 && (
                  <p>Voice: <span className="font-medium text-slate-600">{d.engagement.keywork_voice_rate}%</span></p>
                )}
                {d.engagement.therapy_attendance_rate > 0 && (
                  <p>Therapy: <span className={d.engagement.therapy_attendance_rate >= 80 ? "text-green-600 font-medium" : "text-amber-600 font-medium"}>{d.engagement.therapy_attendance_rate}%</span></p>
                )}
                <p>Rewards: <span className="font-medium text-slate-600">{d.reward_balance.rewards_30d}</span> · Sanctions: <span className="font-medium text-slate-600">{d.reward_balance.sanctions_30d}</span></p>
              </div>
            </div>
          </div>
        )}

        {/* Trigger Themes */}
        {d.behaviour.trigger_themes.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Key Triggers</p>
            <div className="flex flex-wrap gap-1">
              {d.behaviour.trigger_themes.slice(0, 4).map((t, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800">
                  {t.trigger} ({t.count})
                </span>
              ))}
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

        {/* ARIA Emotional Wellbeing Intelligence */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Emotional Wellbeing Intelligence
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
