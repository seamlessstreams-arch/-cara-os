"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME WELLBEING INTELLIGENCE CARD
// Home-level: emotional temperature, mood trends, sleep quality, welfare,
// per-child wellbeing profiles, children of concern, Cara insights.
// CHR 2015 Reg 6, 7, 34. SCCIF: "Experiences and progress of children."
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle, Brain, Loader2, Heart, AlertCircle,
  Sparkles, TrendingUp, TrendingDown, Minus, Smile,
  Moon, ShieldCheck, Activity, User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHomeWellbeingIntelligence } from "@/hooks/use-home-wellbeing-intelligence";
import type { HomeTemperature } from "@/lib/engines/home-wellbeing-intelligence-engine";
import { below, formatRate, meets } from "@/lib/metrics/rate";

// ── Style Maps ──────────────────────────────────────────────────────────────

const TEMP_STYLES: Record<HomeTemperature, { bg: string; text: string; border: string; label: string }> = {
  thriving:    { bg: "bg-green-100",  text: "text-green-800",  border: "border-green-300",  label: "THRIVING" },
  positive:    { bg: "bg-blue-100",   text: "text-blue-800",   border: "border-blue-300",   label: "POSITIVE" },
  settled:     { bg: "bg-sky-100",    text: "text-sky-800",    border: "border-sky-300",    label: "SETTLED" },
  unsettled:   { bg: "bg-amber-100",  text: "text-amber-800",  border: "border-amber-300",  label: "UNSETTLED" },
  concerning:  { bg: "bg-red-100",    text: "text-red-800",    border: "border-red-300",    label: "CONCERNING" },
};

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  warning: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  positive: "border-[--cs-success-soft] bg-[--cs-success-bg] text-[--cs-success]",
};

const REC_STYLES: Record<string, string> = {
  immediate: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  soon: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  planned: "border-[--cs-info-soft] bg-[--cs-info-bg] text-[--cs-info]",
};

const TREND_ICON = {
  improving: TrendingUp,
  stable: Minus,
  declining: TrendingDown,
  insufficient_data: Minus,
};

const TREND_TEXT: Record<string, string> = {
  improving: "text-[--cs-success]",
  stable: "text-slate-500",
  declining: "text-[--cs-risk]",
  insufficient_data: "text-slate-400",
};

function moodColor(score: number): string {
  if (score >= 7) return "text-[--cs-success]";
  if (score >= 5) return "text-[--cs-warning]";
  return "text-[--cs-risk]";
}

function moodBg(score: number): string {
  if (score >= 7) return "bg-green-50";
  if (score >= 5) return "bg-amber-50";
  return "bg-red-50";
}

function wellbeingColor(score: number): string {
  if (score >= 65) return "text-[--cs-success]";
  if (score >= 50) return "text-[--cs-warning]";
  if (score >= 35) return "text-orange-600";
  return "text-[--cs-risk]";
}

function wellbeingBg(score: number): string {
  if (score >= 65) return "bg-green-500";
  if (score >= 50) return "bg-amber-500";
  if (score >= 35) return "bg-orange-500";
  return "bg-red-500";
}

// ── Component ───────────────────────────────────────────────────────────────

export function HomeWellbeingIntelligenceCard() {
  const { data, isLoading } = useHomeWellbeingIntelligence();

  if (isLoading) {
    return (
      <Card className="col-span-full overflow-hidden border-slate-200">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const d = data?.data;
  if (!d) return null;

  const tempStyle = TEMP_STYLES[d.temperature] ?? TEMP_STYLES.settled;
  const MoodTrendIcon = TREND_ICON[d.mood_snapshot.trend];

  return (
    <Card className="col-span-full overflow-hidden border-slate-200">
      <CardHeader className="pb-3 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Heart className="h-4 w-4 text-rose-500" />
            <span className="text-slate-900">Home Wellbeing Temperature</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", tempStyle.bg, tempStyle.text, tempStyle.border)}>
              {tempStyle.label}
            </span>
            <span className="text-xs font-bold tabular-nums text-slate-600">{d.temperature_score}%</span>
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Mood + Sleep Overview Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", d.mood_snapshot.average_mood_7d !== null ? moodBg(d.mood_snapshot.average_mood_7d) : "bg-slate-50")}>
            <div className="flex items-center justify-center gap-1">
              <Smile className={cn("h-4 w-4", d.mood_snapshot.average_mood_7d !== null ? moodColor(d.mood_snapshot.average_mood_7d) : "text-slate-400")} />
              <p className={cn("text-lg font-bold tabular-nums", d.mood_snapshot.average_mood_7d !== null ? moodColor(d.mood_snapshot.average_mood_7d) : "text-slate-400")}>
                {d.mood_snapshot.average_mood_7d !== null ? `${d.mood_snapshot.average_mood_7d}/10` : "—"}
              </p>
              <MoodTrendIcon className={cn("h-3.5 w-3.5", TREND_TEXT[d.mood_snapshot.trend])} />
            </div>
            <p className="text-[10px] text-muted-foreground">Mood (7d avg)</p>
            {d.mood_snapshot.trend !== "insufficient_data" && (
              <p className={cn("text-[10px] capitalize", TREND_TEXT[d.mood_snapshot.trend])}>{d.mood_snapshot.trend}</p>
            )}
          </div>
          <div className="text-center rounded-lg bg-slate-50 p-2">
            <div className="flex items-center justify-center gap-1">
              <Smile className={cn("h-4 w-4", d.mood_snapshot.average_mood_30d !== null ? moodColor(d.mood_snapshot.average_mood_30d) : "text-slate-400")} />
              <p className={cn("text-lg font-bold tabular-nums", d.mood_snapshot.average_mood_30d !== null ? moodColor(d.mood_snapshot.average_mood_30d) : "text-slate-400")}>
                {d.mood_snapshot.average_mood_30d !== null ? `${d.mood_snapshot.average_mood_30d}/10` : "—"}
              </p>
            </div>
            <p className="text-[10px] text-muted-foreground">Mood (30d avg)</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", meets(d.sleep_overview.good_rate, 70) ? "bg-indigo-50" : meets(d.sleep_overview.good_rate, 40) ? "bg-amber-50" : below(d.sleep_overview.good_rate, 40) ? "bg-red-50" : "bg-slate-50")}>
            <div className="flex items-center justify-center gap-1">
              <Moon className={cn("h-4 w-4", meets(d.sleep_overview.good_rate, 70) ? "text-indigo-500" : meets(d.sleep_overview.good_rate, 40) ? "text-amber-500" : below(d.sleep_overview.good_rate, 40) ? "text-red-500" : "text-slate-400")} />
              <p className={cn("text-lg font-bold tabular-nums", meets(d.sleep_overview.good_rate, 70) ? "text-indigo-600" : meets(d.sleep_overview.good_rate, 40) ? "text-[--cs-warning]" : below(d.sleep_overview.good_rate, 40) ? "text-[--cs-risk]" : "text-slate-400")}>
                {formatRate(d.sleep_overview.good_rate)}
              </p>
            </div>
            <p className="text-[10px] text-muted-foreground">Good Sleep</p>
            {d.sleep_overview.total_disturbances_7d > 0 && (
              <p className="text-[10px] text-amber-600">{d.sleep_overview.total_disturbances_7d} disturbance{d.sleep_overview.total_disturbances_7d !== 1 ? "s" : ""}</p>
            )}
          </div>
          <div className="text-center rounded-lg bg-slate-50 p-2">
            <div className="flex items-center justify-center gap-1">
              <ShieldCheck className={cn("h-4 w-4", d.children_of_concern.length === 0 ? "text-green-500" : "text-red-500")} />
              <p className={cn("text-lg font-bold tabular-nums", d.children_of_concern.length === 0 ? "text-[--cs-success]" : "text-[--cs-risk]")}>
                {d.children_of_concern.length}
              </p>
            </div>
            <p className="text-[10px] text-muted-foreground">Of Concern</p>
          </div>
        </div>

        {/* Per-Child Wellbeing Profiles */}
        {d.child_profiles.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <User className="h-3 w-3" />
              Child Wellbeing Profiles ({d.child_profiles.length})
            </p>
            <div className="grid gap-1.5">
              {d.child_profiles.map((cp) => (
                <div key={cp.child_id} className="rounded border border-slate-200 bg-slate-50 p-2 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-700">{cp.child_name}</span>
                      <span className={cn("font-bold tabular-nums", wellbeingColor(cp.wellbeing_score))}>{cp.wellbeing_score}%</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      {cp.avg_mood_7d !== null && (
                        <span className={moodColor(cp.avg_mood_7d)}>Mood {cp.avg_mood_7d}/10</span>
                      )}
                      {cp.mood_trend !== "insufficient_data" && (
                        <span className={cn("capitalize", TREND_TEXT[cp.mood_trend])}>{cp.mood_trend}</span>
                      )}
                      {cp.incident_count_30d > 0 && (
                        <span className="text-[--cs-risk]">{cp.incident_count_30d} incident{cp.incident_count_30d !== 1 ? "s" : ""}</span>
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5">
                    <div className={cn("h-1.5 rounded-full", wellbeingBg(cp.wellbeing_score))} style={{ width: `${Math.min(cp.wellbeing_score, 100)}%` }} />
                  </div>
                  {(cp.flags?.length ?? 0) > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(cp.flags ?? []).map((f, i) => (
                        <span key={i} className="inline-flex text-[9px] px-1.5 py-0.5 rounded bg-[--cs-risk-bg] text-[--cs-risk] border border-red-200">
                          {f}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Children With Poor Sleep */}
        {d.sleep_overview.children_with_poor_sleep.length > 0 && (
          <div className="rounded border border-indigo-200 bg-indigo-50 p-2 text-xs">
            <p className="font-medium text-indigo-700 flex items-center gap-1 mb-1">
              <Moon className="h-3 w-3" />
              Poor Sleep
            </p>
            <div className="flex flex-wrap gap-1">
              {d.sleep_overview.children_with_poor_sleep.map((name, i) => (
                <span key={i} className="inline-flex items-center bg-white/60 rounded px-1.5 py-0.5 text-[10px] text-indigo-800 border border-indigo-200">
                  {name}
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
              <div key={i} className="rounded border border-[--cs-success-soft] bg-[--cs-success-bg] p-2.5 text-xs text-[--cs-success] leading-relaxed">
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
              <div key={i} className="rounded border border-[--cs-risk-soft] bg-[--cs-risk-bg] p-2.5 text-xs text-[--cs-risk] leading-relaxed">
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

        {/* Cara Wellbeing Insights */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Wellbeing Intelligence
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
