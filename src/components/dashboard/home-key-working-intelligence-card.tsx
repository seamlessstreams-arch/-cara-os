"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME KEY WORKING INTELLIGENCE CARD
// Home-level: key working sessions, child voice, mood tracking, coverage —
// holistic key working intelligence view for the home dashboard.
// CHR 2015 Reg 14, 44. SCCIF: "Experiences and progress of children."
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2, AlertCircle, AlertTriangle,
  Sparkles, Brain, Heart, Users,
  CalendarCheck, MessageSquare, TrendingUp, TrendingDown, Minus,
  SmilePlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHomeKeyWorkingIntelligence } from "@/hooks/use-home-key-working-intelligence";
import type { KeyWorkingRating } from "@/lib/engines/home-key-working-intelligence-engine";

// ── Style Maps ──────────────────────────────────────────────────────────────

const RATING_STYLES: Record<KeyWorkingRating, { bg: string; text: string; border: string; label: string }> = {
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

const TREND_ICON = {
  improving: TrendingUp,
  stable: Minus,
  declining: TrendingDown,
  insufficient_data: Minus,
};

const TREND_COLOR: Record<string, string> = {
  improving: "text-green-600",
  stable: "text-slate-500",
  declining: "text-red-600",
  insufficient_data: "text-slate-400",
};

// ── Component ───────────────────────────────────────────────────────────────

export function HomeKeyWorkingIntelligenceCard() {
  const { data, isLoading } = useHomeKeyWorkingIntelligence();

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

  const ratingStyle = RATING_STYLES[d.key_working_rating] ?? RATING_STYLES.insufficient_data;
  const hasUncovered = d.coverage.children_without_sessions_30d.length > 0;
  const isAlert = hasUncovered || d.key_working_rating === "inadequate" || d.sessions.total_30d === 0;

  const TrendIcon = TREND_ICON[d.trend];

  return (
    <Card className={cn("overflow-hidden", isAlert ? "border-red-400 border-2" : "border-slate-200")}>
      <CardHeader className={cn("pb-3", isAlert ? "bg-red-50" : "bg-slate-50/50")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Heart className={cn("h-4 w-4", isAlert ? "text-red-600" : "text-pink-500")} />
            <span className="text-slate-900">Key Working</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
              {ratingStyle.label}
            </span>
            {d.key_working_rating !== "insufficient_data" && (
              <span className="text-xs font-bold tabular-nums text-slate-600">{d.key_working_score}%</span>
            )}
            {d.trend !== "insufficient_data" && (
              <TrendIcon className={cn("h-3 w-3", TREND_COLOR[d.trend])} />
            )}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* KPI Row */}
        {d.key_working_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Sessions 30d */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <CalendarCheck className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums", d.sessions.total_30d >= 6 ? "text-green-600" : d.sessions.total_30d >= 3 ? "text-amber-600" : "text-red-600")}>
                  {d.sessions.total_30d}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Sessions (30d)</p>
            </div>

            {/* Child Voice */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums", d.sessions.child_voice_rate >= 90 ? "text-green-600" : d.sessions.child_voice_rate >= 70 ? "text-amber-600" : "text-red-600")}>
                  {d.sessions.child_voice_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Child Voice</p>
            </div>

            {/* Mood Uplift */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <SmilePlus className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums", d.mood.positive_shift_rate >= 70 ? "text-green-600" : d.mood.positive_shift_rate >= 50 ? "text-amber-600" : "text-red-600")}>
                  {d.mood.positive_shift_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Mood Uplift</p>
            </div>

            {/* Coverage */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Users className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums", hasUncovered ? "text-red-600" : "text-green-600")}>
                  {d.coverage.children_with_sessions_30d}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Children (30d)</p>
            </div>
          </div>
        )}

        {/* Detail Panels */}
        {d.key_working_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 gap-1.5">
            {/* Session Quality */}
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Session Quality</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Avg duration: <span className={cn("font-medium", d.sessions.avg_duration_minutes >= 30 ? "text-green-600" : d.sessions.avg_duration_minutes >= 20 ? "text-amber-600" : "text-red-600")}>{d.sessions.avg_duration_minutes}min</span></p>
                <p>Actions/session: <span className={cn("font-medium", d.sessions.actions_per_session >= 2 ? "text-green-600" : "text-amber-600")}>{d.sessions.actions_per_session}</span></p>
                <p>Follow-up: <span className={cn("font-medium", d.sessions.follow_up_rate >= 90 ? "text-green-600" : d.sessions.follow_up_rate >= 70 ? "text-amber-600" : "text-red-600")}>{d.sessions.follow_up_rate}%</span></p>
                <p>Goal-linked: <span className={cn("font-medium", d.sessions.goal_linked_rate >= 70 ? "text-green-600" : d.sessions.goal_linked_rate >= 40 ? "text-amber-600" : "text-red-600")}>{d.sessions.goal_linked_rate}%</span></p>
              </div>
            </div>

            {/* Mood & Coverage */}
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Mood & Coverage</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Avg mood: <span className="font-medium text-slate-600">{d.mood.avg_mood_before} → {d.mood.avg_mood_after}</span></p>
                <p>Improvement: <span className={cn("font-medium", d.mood.avg_improvement > 0 ? "text-green-600" : "text-red-600")}>+{d.mood.avg_improvement}</span></p>
                <p>Per child/30d: <span className={cn("font-medium", d.sessions.avg_per_child_30d >= 2 ? "text-green-600" : "text-amber-600")}>{d.sessions.avg_per_child_30d}</span></p>
                {hasUncovered && (
                  <p className="text-red-600 font-medium">{d.coverage.children_without_sessions_30d.length} uncovered</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Session Types */}
        {d.sessions.types_distribution.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Session Types (90d)</p>
            <div className="flex flex-wrap gap-1">
              {d.sessions.types_distribution.slice(0, 6).map((t, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-700">
                  {t.type.replace(/_/g, " ")} ({t.count})
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

        {/* ARIA Key Working Intelligence */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Key Working Intelligence
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
