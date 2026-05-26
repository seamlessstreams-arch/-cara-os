"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CHILD KEYWORKING INTELLIGENCE CARD
// Per-child: keyworking session frequency, quality, mood impact,
// thematic coverage, follow-up completion, key worker consistency.
// CHR 2015 Reg 5, 6, 7, 10. SCCIF: "Quality of care."
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle, Brain, Loader2, AlertCircle,
  Sparkles, Users, Heart, MessageCircle,
  CheckCircle2, Calendar, TrendingUp, TrendingDown, Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useChildKeyworkingIntelligence } from "@/hooks/use-child-keyworking-intelligence";
import type { KeyworkingQualityRating } from "@/lib/engines/child-keyworking-intelligence-engine";

// ── Style Maps ──────────────────────────────────────────────────────────────

const RATING_STYLES: Record<KeyworkingQualityRating, { bg: string; text: string; border: string; label: string }> = {
  outstanding:   { bg: "bg-green-100",  text: "text-green-800",  border: "border-green-300",  label: "OUTSTANDING" },
  good:          { bg: "bg-blue-100",   text: "text-blue-800",   border: "border-blue-300",   label: "GOOD" },
  adequate:      { bg: "bg-amber-100",  text: "text-amber-800",  border: "border-amber-300",  label: "ADEQUATE" },
  inadequate:    { bg: "bg-red-100",    text: "text-red-800",    border: "border-red-300",    label: "INADEQUATE" },
  no_sessions:   { bg: "bg-slate-100",  text: "text-slate-800",  border: "border-slate-300",  label: "NO SESSIONS" },
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

const TREND_ICON = {
  increasing: TrendingUp,
  stable: Minus,
  decreasing: TrendingDown,
  insufficient_data: Minus,
};

const TREND_COLOR: Record<string, string> = {
  increasing: "text-green-600",
  stable: "text-slate-500",
  decreasing: "text-red-600",
  insufficient_data: "text-slate-400",
};

// ── Component ───────────────────────────────────────────────────────────────

export function ChildKeyworkingIntelligenceCard({ childId }: { childId: string }) {
  const { data, isLoading } = useChildKeyworkingIntelligence(childId);

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

  const ratingStyle = RATING_STYLES[d.quality_rating] ?? RATING_STYLES.no_sessions;
  const FreqTrendIcon = TREND_ICON[d.frequency.trend];
  const noRecentSessions = d.frequency.sessions_30d === 0 && d.frequency.total_sessions > 0;

  return (
    <Card className={cn("overflow-hidden", noRecentSessions ? "border-amber-400 border-2" : "border-slate-200")}>
      <CardHeader className={cn("pb-3", noRecentSessions ? "bg-amber-50" : "bg-slate-50/50")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className={cn("h-4 w-4", noRecentSessions ? "text-amber-600" : "text-cyan-500")} />
            <span className="text-slate-900">Keyworking</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
              {ratingStyle.label}
            </span>
            {d.quality_rating !== "no_sessions" && (
              <span className="text-xs font-bold tabular-nums text-slate-600">{d.quality_score}%</span>
            )}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* KPI Row */}
        {d.frequency.total_sessions > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums", d.frequency.sessions_30d >= 4 ? "text-green-600" : d.frequency.sessions_30d >= 2 ? "text-amber-600" : "text-red-600")}>
                  {d.frequency.sessions_30d}
                </p>
                <FreqTrendIcon className={cn("h-3 w-3", TREND_COLOR[d.frequency.trend])} />
              </div>
              <p className="text-[10px] text-muted-foreground">Sessions (30d)</p>
            </div>
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Heart className={cn("h-3.5 w-3.5", d.mood_impact.positive_impact_rate >= 70 ? "text-green-500" : d.mood_impact.positive_impact_rate >= 50 ? "text-amber-500" : "text-red-500")} />
                <p className={cn("text-lg font-bold tabular-nums", d.mood_impact.avg_improvement > 0 ? "text-green-600" : d.mood_impact.avg_improvement < 0 ? "text-red-600" : "text-slate-600")}>
                  {d.mood_impact.avg_improvement > 0 ? "+" : ""}{d.mood_impact.avg_improvement}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Avg Mood Δ</p>
            </div>
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <MessageCircle className={cn("h-3.5 w-3.5", d.quality_metrics.child_voice_rate >= 80 ? "text-green-500" : "text-amber-500")} />
                <p className={cn("text-lg font-bold tabular-nums", d.quality_metrics.child_voice_rate >= 80 ? "text-green-600" : d.quality_metrics.child_voice_rate >= 50 ? "text-amber-600" : "text-red-600")}>
                  {d.quality_metrics.child_voice_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Voice Rate</p>
            </div>
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <CheckCircle2 className={cn("h-3.5 w-3.5", d.quality_metrics.follow_up_completion_rate >= 80 ? "text-green-500" : "text-amber-500")} />
                <p className={cn("text-lg font-bold tabular-nums", d.quality_metrics.follow_up_completion_rate >= 80 ? "text-green-600" : d.quality_metrics.follow_up_completion_rate >= 50 ? "text-amber-600" : "text-red-600")}>
                  {d.quality_metrics.follow_up_completion_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Follow-ups</p>
            </div>
          </div>
        )}

        {/* Detail Panels */}
        {d.frequency.total_sessions > 0 && (
          <div className="grid grid-cols-2 gap-1.5">
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Session Quality</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Avg duration: <span className="font-medium text-slate-600">{d.quality_metrics.avg_duration_minutes}min</span></p>
                <p>Avg actions: <span className="font-medium text-slate-600">{d.quality_metrics.avg_actions_per_session}</span></p>
                <p>Topic variety: <span className="font-medium text-slate-600">{d.quality_metrics.topic_variety} topics</span></p>
                <p>Session types: <span className="font-medium text-slate-600">{d.session_types.length}</span></p>
              </div>
            </div>
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Mood Impact</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Before: <span className="font-medium text-slate-600">{d.mood_impact.avg_mood_before}/5</span> → After: <span className={cn("font-medium", d.mood_impact.avg_mood_after > d.mood_impact.avg_mood_before ? "text-green-600" : "text-slate-600")}>{d.mood_impact.avg_mood_after}/5</span></p>
                <p>Positive: <span className="font-medium text-green-600">{d.mood_impact.positive_impact_rate}%</span></p>
                {d.mood_impact.negative_impact_rate > 0 && (
                  <p>Negative: <span className="font-medium text-red-600">{d.mood_impact.negative_impact_rate}%</span></p>
                )}
                <p>Key worker: <span className={d.key_worker_consistency ? "text-green-600 font-medium" : "text-amber-600 font-medium"}>{d.key_worker_consistency ? "Consistent" : "Mixed"}</span></p>
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

        {/* ARIA Keyworking Intelligence */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Keyworking Intelligence
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
